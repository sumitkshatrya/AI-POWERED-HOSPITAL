import { Request, Response, NextFunction } from 'express';
import { Patient, User, Appointment, Consultation } from '../models';
import { createPatientSchema, updatePatientSchema } from '../schemas/patient.schema';
import { logAudit } from '../utils/audit';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { safeJsonParseArray, safeJsonParseObject } from '../utils/json';

const formatPatient = (p: any) => ({
  id: p._id ? p._id.toString() : p.id,
  _id: p._id,
  userId: p.userId?._id ? p.userId._id.toString() : p.userId?.toString() || null,
  hospitalId: p.hospitalId?._id ? p.hospitalId._id.toString() : p.hospitalId?.toString() || null,
  branchId: p.branchId?._id ? p.branchId._id.toString() : p.branchId?.toString() || null,
  uhid: p.patientId || p.mrn,
  patientId: p.patientId || p.mrn,
  mrn: p.mrn,
  firstName: p.firstName || '',
  lastName: p.lastName || '',
  gender: p.gender || 'OTHER',
  dateOfBirth: p.dateOfBirth || null,
  bloodGroup: p.bloodGroup || null,
  phone: p.phone || '',
  email: p.email || '',
  address: p.address || '',
  emergencyContactName: p.emergencyContact || '',
  emergencyContactPhone: p.emergencyContact || '',
  allergies: Array.isArray(p.allergies) ? p.allergies : safeJsonParseArray(p.allergies),
  chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions : safeJsonParseArray(p.chronicConditions),
  medicalHistory: Array.isArray(p.medicalHistory) ? p.medicalHistory : safeJsonParseArray(p.medicalHistory),
  existingConditions: Array.isArray(p.existingConditions) ? p.existingConditions : safeJsonParseArray(p.existingConditions),
  previousSurgeries: Array.isArray(p.previousSurgeries) ? p.previousSurgeries : safeJsonParseArray(p.previousSurgeries),
  currentMedication: Array.isArray(p.currentMedications) ? p.currentMedications : safeJsonParseArray(p.currentMedications),
  familyHistory: Array.isArray(p.familyHistory) ? p.familyHistory : safeJsonParseArray(p.familyHistory),
  insuranceProvider: p.insuranceProvider || null,
  insurancePolicyNumber: p.policyNumber || null,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export const registerPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createPatientSchema.parse(req.body);
    const hospitalId = data.hospitalId || req.user?.hospitalId;

    if (!hospitalId) {
      res.status(400).json({ status: 'error', message: 'Hospital ID is required to register a patient.' });
      return;
    }

    const year = new Date().getFullYear();
    const count = await Patient.countDocuments({ hospitalId });

    const uhid = `UHID-${year}-${String(count + 1001).padStart(4, '0')}`;
    const mrn = `MRN-${year}-${String(count + 8801).padStart(4, '0')}`;

    const toArray = (val: any) => (Array.isArray(val) ? val : typeof val === 'string' ? safeJsonParseArray(val) : []);

    const patient = await Patient.create({
      hospitalId,
      branchId: data.branchId || req.user?.branchId,
      patientId: uhid,
      mrn,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      bloodGroup: data.bloodGroup,
      phone: data.phone,
      email: data.email,
      address: data.address,
      emergencyContact: data.emergencyContactPhone || data.emergencyContactName || '',
      allergies: toArray(data.allergies),
      chronicConditions: toArray(data.chronicConditions),
      previousSurgeries: toArray(data.previousSurgeries),
      currentMedications: toArray(data.currentMedication),
      familyHistory: typeof data.familyHistory === 'string' ? data.familyHistory : JSON.stringify(data.familyHistory || []),
      insuranceProvider: data.insuranceProvider,
      policyNumber: data.insurancePolicyNumber,
    });

    await logAudit({
      hospitalId: hospitalId.toString(),
      branchId: patient.branchId?.toString(),
      userId: req.user?.id,
      action: 'PATIENT_REGISTERED',
      resource: 'patients',
      details: `Registered patient ${patient.firstName} ${patient.lastName} (UHID: ${patient.patientId}, MRN: ${patient.mrn})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Patient registered successfully.',
      data: { patient: formatPatient(patient) },
    });
  } catch (err) {
    next(err);
  }
};

export const getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hospitalId = req.user?.hospitalId;
    const { search, page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    // Security & Scope Scoping
    if (req.user?.role === 'PATIENT') {
      query.userId = req.user.id;
    } else if (hospitalId && req.user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }

    if (search) {
      const q = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { patientId: q },
        { mrn: q },
        { firstName: q },
        { lastName: q },
        { phone: q },
      ];
    }

    const sortObj: any = {};
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'name') {
      sortObj.firstName = dir;
    } else if (sortBy === 'uhid') {
      sortObj.patientId = dir;
    } else {
      sortObj.createdAt = dir;
    }

    const [patients, total] = await Promise.all([
      Patient.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Patient.countDocuments(query),
    ]);

    const formatted = patients.map(formatPatient);

    res.status(200).json({
      status: 'success',
      data: {
        patients: formatted,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const patient = await Patient.findOne({
      $or: [{ _id: id }, { patientId: id }, { mrn: id }],
    });

    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    // Security Check
    if (req.user?.role === 'PATIENT' && patient.userId && patient.userId.toString() !== req.user.id) {
      throw new UnauthorizedError('Access denied: You can only access your own patient profile.');
    }

    await logAudit({
      hospitalId: patient.hospitalId.toString(),
      branchId: patient.branchId?.toString(),
      userId: req.user?.id,
      action: 'PATIENT_RECORD_ACCESSED',
      resource: 'patients',
      details: `Accessed patient record for ${patient.firstName} ${patient.lastName} (UHID: ${patient.patientId})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      data: {
        patient: formatPatient(patient),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updatePatientSchema.parse(req.body);

    const existing = await Patient.findOne({
      $or: [{ _id: id }, { patientId: id }, { mrn: id }],
    });
    if (!existing) {
      throw new NotFoundError('Patient record not found.');
    }

    if (req.user?.role === 'PATIENT' && existing.userId && existing.userId.toString() !== req.user.id) {
      throw new UnauthorizedError('Access denied: You can only update your own profile.');
    }

    const toArray = (val: any) => (Array.isArray(val) ? val : typeof val === 'string' ? safeJsonParseArray(val) : undefined);

    const updateObj: any = {};
    if (data.firstName !== undefined) updateObj.firstName = data.firstName;
    if (data.lastName !== undefined) updateObj.lastName = data.lastName;
    if (data.gender !== undefined) updateObj.gender = data.gender;
    if (data.dateOfBirth !== undefined) updateObj.dateOfBirth = new Date(data.dateOfBirth);
    if (data.bloodGroup !== undefined) updateObj.bloodGroup = data.bloodGroup;
    if (data.phone !== undefined) updateObj.phone = data.phone;
    if (data.email !== undefined) updateObj.email = data.email;
    if (data.address !== undefined) updateObj.address = data.address;
    if (data.emergencyContactPhone || data.emergencyContactName) {
      updateObj.emergencyContact = data.emergencyContactPhone || data.emergencyContactName;
    }
    if (data.allergies !== undefined) updateObj.allergies = toArray(data.allergies);
    if (data.chronicConditions !== undefined) updateObj.chronicConditions = toArray(data.chronicConditions);
    if (data.previousSurgeries !== undefined) updateObj.previousSurgeries = toArray(data.previousSurgeries);
    if (data.currentMedication !== undefined) updateObj.currentMedications = toArray(data.currentMedication);
    if (data.familyHistory !== undefined) {
      updateObj.familyHistory = typeof data.familyHistory === 'string' ? data.familyHistory : JSON.stringify(data.familyHistory);
    }
    if (data.insuranceProvider !== undefined) updateObj.insuranceProvider = data.insuranceProvider;
    if (data.insurancePolicyNumber !== undefined) updateObj.policyNumber = data.insurancePolicyNumber;

    const updated = await Patient.findByIdAndUpdate(existing._id, { $set: updateObj }, { new: true });

    if (!updated) {
      throw new NotFoundError('Patient record not found.');
    }

    await logAudit({
      hospitalId: updated.hospitalId.toString(),
      branchId: updated.branchId?.toString(),
      userId: req.user?.id,
      action: 'PATIENT_RECORD_UPDATED',
      resource: 'patients',
      details: `Updated patient profile for ${updated.firstName} ${updated.lastName} (UHID: ${updated.patientId})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Patient profile updated.',
      data: { patient: formatPatient(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientEMRTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const patient = await Patient.findOne({
      $or: [{ _id: id }, { patientId: id }, { mrn: id }],
    });

    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    // Security check
    if (req.user?.role === 'PATIENT' && patient.userId && patient.userId.toString() !== req.user.id) {
      throw new UnauthorizedError('Access denied: You can only view your own EMR timeline.');
    }

    const [consultations, appointments] = await Promise.all([
      Consultation.find({ patientId: patient._id })
        .populate({ path: 'doctorId', populate: { path: 'userId' } })
        .sort({ createdAt: -1 }),
      Appointment.find({ patientId: patient._id })
        .populate({ path: 'doctorId', populate: { path: 'userId' } })
        .sort({ appointmentDate: -1 }),
    ]);

    const formattedPatient = formatPatient(patient);

    const timelineEvents = [
      ...(consultations as any[]).map((c: any) => {
        const docObj: any = c.doctorId && typeof c.doctorId === 'object' ? c.doctorId : null;
        const userObj: any = docObj && docObj.userId && typeof docObj.userId === 'object' ? docObj.userId : null;
        return {
          id: `consultation-${c._id.toString()}`,
          type: 'CONSULTATION',
          date: c.createdAt,
          doctorName: userObj ? `Dr. ${userObj.firstName} ${userObj.lastName}` : 'Attending Doctor',
          specialization: docObj?.specialization || 'General',
          chiefComplaints: c.chiefComplaint,
          clinicalFindings: c.examination || c.assessment,
          vitals: c.vitals || {},
          diagnosisCodes: c.diagnosis || [],
          soapNotes: { assessment: c.assessment, treatmentPlan: c.treatmentPlan },
          prescription: null,
        };
      }),
      ...(appointments as any[]).map((a: any) => {
        const docObj: any = a.doctorId && typeof a.doctorId === 'object' ? a.doctorId : null;
        const userObj: any = docObj && docObj.userId && typeof docObj.userId === 'object' ? docObj.userId : null;
        return {
          id: `appointment-${a._id.toString()}`,
          type: 'APPOINTMENT',
          date: a.appointmentDate,
          doctorName: userObj ? `Dr. ${userObj.firstName} ${userObj.lastName}` : 'Attending Doctor',
          specialization: docObj?.specialization || 'General',
          appointmentType: a.type || 'IN_PERSON',
          reasonForVisit: a.notes || 'Consultation',
          status: a.status,
        };
      }),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await logAudit({
      hospitalId: patient.hospitalId.toString(),
      branchId: patient.branchId?.toString(),
      userId: req.user?.id,
      action: 'EMR_ACCESSED',
      resource: 'emr',
      details: `Accessed EMR timeline for patient ${patient.firstName} ${patient.lastName} (UHID: ${patient.patientId})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      data: {
        patient: formattedPatient,
        timeline: timelineEvents,
      },
    });
  } catch (err) {
    next(err);
  }
};
