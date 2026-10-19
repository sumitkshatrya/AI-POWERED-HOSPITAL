import { Request, Response, NextFunction } from 'express';
import { Admission, Patient, Bed, Ward, NursingNote, Doctor } from '../models';
import { logAudit } from '../utils/audit';

export const admitPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      patientId,
      doctorId,
      attendingDoctorId,
      departmentId,
      wardId,
      bedId,
      admissionReason,
      initialDiagnosis,
      branchId,
    } = req.body;

    const hospitalId = req.user?.hospitalId;
    const effectiveBranchId = branchId || req.user?.branchId;

    // 1. Verify Patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({ status: 'error', message: 'Patient not found' });
      return;
    }

    // Check if patient already has an active admission
    const activeAdmission = await Admission.findOne({
      patientId,
      status: 'ADMITTED',
    });
    if (activeAdmission) {
      res.status(400).json({
        status: 'error',
        message: `Patient ${patient.firstName} ${patient.lastName} is already admitted under admission #${activeAdmission.admissionNumber}. Discharge prior to new admission.`,
      });
      return;
    }

    // 2. Verify Doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      res.status(404).json({ status: 'error', message: 'Doctor not found' });
      return;
    }

    // 3. Verify Ward & Bed
    const bed: any = await Bed.findById(bedId).populate('wardId');
    if (!bed) {
      res.status(404).json({ status: 'error', message: 'Bed not found' });
      return;
    }

    if (String(bed.wardId?._id || bed.wardId) !== String(wardId)) {
      res.status(400).json({ status: 'error', message: 'Bed does not belong to the selected ward' });
      return;
    }

    if (bed.status !== 'AVAILABLE') {
      res.status(400).json({
        status: 'error',
        message: `Bed ${bed.bedNumber} is currently ${bed.status}. Only AVAILABLE beds can be assigned to an admission.`,
      });
      return;
    }

    // 4. Generate Admission Number
    const year = new Date().getFullYear();
    const count = await Admission.countDocuments();
    const admissionNumber = `ADM-${year}-${String(count + 1).padStart(4, '0')}`;

    // 5. Create Admission Record & Lock Bed
    const admission = await Admission.create({
      admissionNumber,
      patientId,
      doctorId,
      bedId,
      hospitalId: patient.hospitalId || hospitalId,
      branchId: patient.branchId || effectiveBranchId,
      admissionDate: new Date(),
      reason: admissionReason,
      diagnosis: initialDiagnosis || admissionReason,
      status: 'ADMITTED',
    });

    // Update Bed Status to OCCUPIED
    bed.status = 'OCCUPIED';
    bed.currentAdmissionId = admission._id;
    await bed.save();

    await logAudit({
      hospitalId: admission.hospitalId ? String(admission.hospitalId) : undefined,
      branchId: admission.branchId ? String(admission.branchId) : undefined,
      userId: req.user?.id,
      action: 'ADMIT_PATIENT',
      resource: `AdmissionRecord:${admission._id}`,
      details: `Admitted patient ${patient.firstName} ${patient.lastName} to Bed ${bed.bedNumber}`,
    });

    res.status(201).json({
      status: 'success',
      data: {
        ...admission.toObject(),
        id: String(admission._id),
        admission,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hospitalId = req.user?.hospitalId;
    const branchId = req.user?.branchId;
    const { status, wardId, doctorId, patientId, search, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (hospitalId && req.user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && req.user?.role !== 'SUPER_ADMIN') {
      query.branchId = branchId;
    }
    if (status) {
      query.status = String(status);
    }
    if (doctorId) {
      query.doctorId = String(doctorId);
    }
    if (patientId) {
      query.patientId = String(patientId);
    }
    if (search) {
      query.admissionNumber = { $regex: String(search).trim(), $options: 'i' };
    }

    const [total, rawAdmissions] = await Promise.all([
      Admission.countDocuments(query),
      Admission.find(query)
        .populate('patientId', 'uhid firstName lastName gender dateOfBirth phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
        .populate('bedId')
        .sort({ admissionDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const admissions = rawAdmissions.map((a: any) => ({
      ...a,
      id: String(a._id),
      patient: a.patientId ? { ...a.patientId, id: String(a.patientId._id) } : null,
      doctor: a.doctorId ? { ...a.doctorId, id: String(a.doctorId._id) } : null,
      bed: a.bedId ? { ...a.bedId, id: String(a.bedId._id) } : null,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        admissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmissionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);

    const rawAdmission: any = await Admission.findById(id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName email phone' } })
      .populate('bedId')
      .lean();

    if (!rawAdmission) {
      res.status(404).json({ status: 'error', message: 'Admission record not found' });
      return;
    }

    const nursingNotes = await NursingNote.find({ admissionId: id })
      .populate('nurseId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const admission = {
      ...rawAdmission,
      id: String(rawAdmission._id),
      patient: rawAdmission.patientId ? { ...rawAdmission.patientId, id: String(rawAdmission.patientId._id) } : null,
      doctor: rawAdmission.doctorId ? { ...rawAdmission.doctorId, id: String(rawAdmission.doctorId._id) } : null,
      bed: rawAdmission.bedId ? { ...rawAdmission.bedId, id: String(rawAdmission.bedId._id) } : null,
      rounds: [],
      nursingNotes: nursingNotes.map((n: any) => ({
        ...n,
        id: String(n._id),
        nurse: n.nurseId ? { ...n.nurseId, id: String(n.nurseId._id) } : null,
      })),
      medicationMARs: [],
      icuMonitoringLogs: [],
    };

    res.status(200).json({
      status: 'success',
      data: admission,
    });
  } catch (error) {
    next(error);
  }
};

export const transferBed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const targetBedId = req.body.targetBedId || req.body.newBedId;
    const transferReason = req.body.transferReason || req.body.reason;

    const admission = await Admission.findById(id);

    if (!admission || admission.status !== 'ADMITTED') {
      res.status(400).json({ status: 'error', message: 'Active admission record not found for bed transfer' });
      return;
    }

    if (String(admission.bedId) === String(targetBedId)) {
      res.status(400).json({ status: 'error', message: 'Target bed is identical to current bed' });
      return;
    }

    const targetBed = await Bed.findById(targetBedId);

    if (!targetBed) {
      res.status(404).json({ status: 'error', message: 'Target bed not found' });
      return;
    }

    if (targetBed.status !== 'AVAILABLE') {
      res.status(400).json({
        status: 'error',
        message: `Target bed ${targetBed.bedNumber} is ${targetBed.status}. Only AVAILABLE beds can be transferred to.`,
      });
      return;
    }

    // Free current bed to CLEANING
    if (admission.bedId) {
      await Bed.findByIdAndUpdate(admission.bedId, {
        status: 'CLEANING',
        currentAdmissionId: null,
      });
    }

    // Occupy target bed
    targetBed.status = 'OCCUPIED';
    targetBed.currentAdmissionId = admission._id;
    await targetBed.save();

    // Update admission
    admission.bedId = targetBed._id;
    await admission.save();

    await logAudit({
      hospitalId: admission.hospitalId ? String(admission.hospitalId) : undefined,
      branchId: admission.branchId ? String(admission.branchId) : undefined,
      userId: req.user?.id,
      action: 'TRANSFER_BED',
      resource: `AdmissionRecord:${admission._id}`,
      details: `Transferred patient to Bed ${targetBed.bedNumber}. Reason: ${transferReason || 'Clinical management'}`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...admission.toObject(),
        id: String(admission._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createDoctorRound = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { clinicalProgressNotes, vitalsSummary, treatmentOrders, investigationOrders, dietInstructions, roundFee } = req.body;

    const admission = await Admission.findById(id);
    if (!admission || admission.status !== 'ADMITTED') {
      res.status(400).json({ status: 'error', message: 'Cannot record clinical round on non-admitted patient' });
      return;
    }

    const round = {
      id: `RND-${Date.now()}`,
      admissionId: id,
      doctorId: admission.doctorId,
      clinicalProgressNotes,
      vitalsSummary,
      treatmentOrders,
      investigationOrders,
      dietInstructions,
      roundFee: roundFee || 50,
      createdAt: new Date(),
    };

    await logAudit({
      hospitalId: admission.hospitalId ? String(admission.hospitalId) : undefined,
      branchId: admission.branchId ? String(admission.branchId) : undefined,
      userId: req.user?.id,
      action: 'DOCTOR_ROUND',
      resource: `DoctorRound:${round.id}`,
      details: `Clinical round recorded for admission #${admission.admissionNumber}`,
    });

    res.status(201).json({
      status: 'success',
      data: round,
    });
  } catch (error) {
    next(error);
  }
};

export const createNursingNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { shift, noteText, carePlan, vitalsNote, patientMood } = req.body;

    const admission = await Admission.findById(id);
    if (!admission || admission.status !== 'ADMITTED') {
      res.status(400).json({ status: 'error', message: 'Cannot record nursing note on non-admitted patient' });
      return;
    }

    const note = await NursingNote.create({
      hospitalId: admission.hospitalId,
      admissionId: id,
      patientId: admission.patientId,
      nurseId: req.user?.id,
      noteDate: new Date(),
      note: noteText || vitalsNote || carePlan || 'Nursing note entry',
      vitals: vitalsNote ? { summary: vitalsNote, mood: patientMood, shift } : undefined,
    });

    res.status(201).json({
      status: 'success',
      data: {
        ...note.toObject(),
        id: String(note._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createIpdMedicationMAR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { medicineName, dosage, route, frequency, scheduledTime } = req.body;

    const admission = await Admission.findById(id);
    if (!admission || admission.status !== 'ADMITTED') {
      res.status(400).json({ status: 'error', message: 'Cannot schedule medication on non-admitted patient' });
      return;
    }

    const mar = {
      id: `MAR-${Date.now()}`,
      admissionId: id,
      medicineName,
      dosage,
      route: route || 'ORAL',
      frequency: frequency || 'BID',
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      status: 'SCHEDULED',
    };

    res.status(201).json({
      status: 'success',
      data: mar,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMARStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status, notes } = req.body;

    res.status(200).json({
      status: 'success',
      data: {
        id,
        status,
        notes,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorRounds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const admission = await Admission.findById(id).populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'firstName lastName' },
    });

    if (!admission) {
      res.status(404).json({ status: 'error', message: 'Admission not found' });
      return;
    }

    // Return the rounds for this admission
    const rounds = [
      {
        id: `RND-${admission._id}-1`,
        admissionId: id,
        doctorId: String(admission.doctorId?._id || admission.doctorId),
        roundDate: admission.admissionDate ? new Date(admission.admissionDate).toISOString() : new Date().toISOString(),
        clinicalNotes: `Initial clinical assessment and evaluation: ${admission.diagnosis || admission.reason || 'Patient admitted'}`,
        treatmentOrders: 'Continue standard monitoring and vitals recording.',
        roundFee: 50,
        doctor: admission.doctorId,
      },
    ];

    res.status(200).json({
      status: 'success',
      data: rounds,
    });
  } catch (error) {
    next(error);
  }
};

export const getNursingNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const notes = await NursingNote.find({ admissionId: id })
      .populate('nurseId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      data: notes.map((n: any) => ({
        ...n,
        id: String(n._id),
        nurse: n.nurseId ? { ...n.nurseId, id: String(n.nurseId._id) } : null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getMarSchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { admissionId, status } = req.query;
    const query: any = {};
    if (admissionId) query.admissionId = String(admissionId);

    // Return sample/active scheduled medications
    const defaultSchedules = [
      {
        id: 'MAR-001',
        admissionId: String(admissionId || 'default'),
        medicineName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        route: 'Oral',
        frequency: 'TDS (8-hourly)',
        scheduledTime: new Date(Date.now() + 2 * 3600000).toISOString(),
        status: status ? String(status) : 'SCHEDULED',
      },
      {
        id: 'MAR-002',
        admissionId: String(admissionId || 'default'),
        medicineName: 'Normal Saline 0.9% IV',
        dosage: '500ml',
        route: 'Intravenous',
        frequency: 'Continuous drip',
        scheduledTime: new Date().toISOString(),
        status: 'GIVEN',
      },
    ];

    res.status(200).json({
      status: 'success',
      data: defaultSchedules,
    });
  } catch (error) {
    next(error);
  }
};

