import { Request, Response, NextFunction } from 'express';
import { EmergencyCase, Patient, Doctor } from '../models';
import { logAudit } from '../utils/audit';
import {
  createEmergencyVisitSchema,
  updateTriageSchema,
  updateEmergencyStatusSchema,
} from '../schemas/emergency.schema';

export const getEmergencyVisits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const hospitalId = user?.hospitalId;
    const branchId = user?.branchId;
    const { status, triageLevel, emergencyType, search } = req.query;

    const query: any = {};
    if (hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && user?.role !== 'SUPER_ADMIN') {
      query.$or = [{ branchId: String(branchId) }, { branchId: null }];
    }
    if (status && status !== 'ALL') {
      query.status = String(status);
    }
    if (triageLevel && triageLevel !== 'ALL') {
      query.triageLevel = String(triageLevel);
    }
    if (emergencyType && emergencyType !== 'ALL') {
      query.emergencyType = String(emergencyType);
    }
    if (search) {
      const q = String(search);
      query.$or = [
        { caseNumber: { $regex: q, $options: 'i' } },
        { patientName: { $regex: q, $options: 'i' } },
        { emergencyType: { $regex: q, $options: 'i' } },
      ];
    }

    const cases = await EmergencyCase.find(query)
      .populate('patientId')
      .populate({ path: 'assignedDoctorId', populate: { path: 'userId', select: 'firstName lastName email' } })
      .sort({ arrivalTime: -1 })
      .lean();

    const visits = cases.map((c: any) => ({
      ...c,
      id: String(c._id),
      visitNumber: c.caseNumber,
      unknownPatientName: c.patientName,
      patient: c.patientId ? { ...c.patientId, id: String(c.patientId._id) } : null,
      assignedDoctor: c.assignedDoctorId ? { ...c.assignedDoctorId, id: String(c.assignedDoctorId._id) } : null,
      chiefComplaint: c.notes || c.emergencyType,
    }));

    res.status(200).json({
      status: 'success',
      data: visits,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmergencyDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const hospitalId = user?.hospitalId;
    const branchId = user?.branchId;

    const query: any = {};
    if (hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && user?.role !== 'SUPER_ADMIN') {
      query.$or = [{ branchId: String(branchId) }, { branchId: null }];
    }

    const cases = await EmergencyCase.find(query)
      .populate('patientId')
      .populate({ path: 'assignedDoctorId', populate: { path: 'userId', select: 'firstName lastName' } })
      .sort({ arrivalTime: -1 })
      .lean();

    const allVisits = cases.map((c: any) => ({
      ...c,
      id: String(c._id),
      visitNumber: c.caseNumber,
      unknownPatientName: c.patientName,
      patient: c.patientId ? { ...c.patientId, id: String(c.patientId._id) } : null,
      assignedDoctor: c.assignedDoctorId ? { ...c.assignedDoctorId, id: String(c.assignedDoctorId._id) } : null,
      chiefComplaint: c.notes || c.emergencyType,
    }));

    const activeVisits = allVisits.filter((v: any) => v.status === 'ACTIVE' || v.status === 'TRIAGED').length;
    const waitingVisits = allVisits.filter((v: any) => v.status === 'WAITING' || v.status === 'TRIAGED').length;
    const criticalVisits = allVisits.filter((v: any) => v.triageLevel === 'RESUSCITATION' || v.triageLevel === 'EMERGENT').length;
    const stabilizedVisits = allVisits.filter((v: any) => v.status === 'STABILIZED').length;
    const admittedVisits = allVisits.filter((v: any) => v.status === 'ADMITTED').length;
    const dischargedVisits = allVisits.filter((v: any) => v.status === 'DISCHARGED').length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRegistrations = allVisits.filter((v: any) => new Date(v.arrivalTime) >= todayStart).length;

    const triageBreakdown = {
      CRITICAL: allVisits.filter((v: any) => v.triageLevel === 'RESUSCITATION' || v.triageLevel === 'EMERGENT').length,
      HIGH: allVisits.filter((v: any) => v.triageLevel === 'URGENT').length,
      MEDIUM: allVisits.filter((v: any) => v.triageLevel === 'LESS_URGENT').length,
      LOW: allVisits.filter((v: any) => v.triageLevel === 'NON_URGENT').length,
    };

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          activeVisits,
          waitingVisits,
          criticalVisits,
          stabilizedVisits,
          admittedVisits,
          dischargedVisits,
          todayRegistrations,
          triageBreakdown,
        },
        clinicalDisclaimer:
          'Triage categorization is clinical decision support and does not constitute independent medical advice. Final triage priority must be confirmed by authorized emergency medical personnel.',
        recentVisits: allVisits.slice(0, 20),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createEmergencyVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const validated = createEmergencyVisitSchema.parse(req.body);
    const hospitalId = user?.hospitalId;
    const effectiveBranchId = validated.branchId || user?.branchId;

    if (!validated.patientId && !validated.unknownPatientName) {
      res.status(400).json({
        status: 'error',
        message: 'Must provide registered patientId or unknownPatientName for emergency walk-in',
      });
      return;
    }

    let patientObj: any = null;
    if (validated.patientId) {
      patientObj = await Patient.findById(validated.patientId);
      if (!patientObj) {
        res.status(404).json({ status: 'error', message: 'Patient not found' });
        return;
      }
    }

    const year = new Date().getFullYear();
    const count = await EmergencyCase.countDocuments();
    const visitNumber = `EMG-${year}-${(count + 1).toString().padStart(4, '0')}`;

    let mappedTriage: any = 'URGENT';
    if (validated.triageLevel === 'CRITICAL') mappedTriage = 'EMERGENT';
    else if (validated.triageLevel === 'HIGH') mappedTriage = 'URGENT';
    else if (validated.triageLevel === 'MEDIUM') mappedTriage = 'LESS_URGENT';
    else if (validated.triageLevel === 'LOW') mappedTriage = 'NON_URGENT';

    const emergencyCase = await EmergencyCase.create({
      caseNumber: visitNumber,
      hospitalId,
      branchId: effectiveBranchId,
      patientId: validated.patientId || undefined,
      patientName: validated.unknownPatientName || (patientObj ? `${patientObj.firstName} ${patientObj.lastName}` : undefined),
      arrivalTime: validated.arrivalTime ? new Date(validated.arrivalTime) : new Date(),
      emergencyType: validated.emergencyType,
      triageLevel: mappedTriage,
      vitals: validated.initialVitals,
      assignedDoctorId: validated.assignedDoctorId || undefined,
      status: validated.triageLevel === 'CRITICAL' ? 'CRITICAL' : 'WAITING',
      notes: validated.chiefComplaint || validated.triageNotes,
    });

    await logAudit({
      hospitalId: hospitalId ? String(hospitalId) : undefined,
      branchId: effectiveBranchId ? String(effectiveBranchId) : undefined,
      userId: user?.id,
      action: 'EMERGENCY_REGISTRATION',
      resource: `EmergencyVisit:${emergencyCase._id}`,
      details: `Fast emergency registration for ${emergencyCase.patientName || 'Patient'} (#${visitNumber}), Triage: ${validated.triageLevel}`,
    });

    res.status(201).json({
      status: 'success',
      data: {
        ...emergencyCase.toObject(),
        id: String(emergencyCase._id),
        visitNumber,
        unknownPatientName: emergencyCase.patientName,
        chiefComplaint: validated.chiefComplaint,
        triageLevel: validated.triageLevel || 'MEDIUM',
        clinicalDisclaimer:
          'Triage categorization is clinical decision support and does not constitute independent medical advice. Final triage priority must be confirmed by authorized emergency medical personnel.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTriage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);
    const validated = updateTriageSchema.parse(req.body);

    const existing = await EmergencyCase.findById(id);
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Emergency visit not found' });
      return;
    }

    let mappedTriage: any = 'URGENT';
    if (validated.triageLevel === 'CRITICAL') mappedTriage = 'EMERGENT';
    else if (validated.triageLevel === 'HIGH') mappedTriage = 'URGENT';
    else if (validated.triageLevel === 'MEDIUM') mappedTriage = 'LESS_URGENT';
    else if (validated.triageLevel === 'LOW') mappedTriage = 'NON_URGENT';

    existing.triageLevel = mappedTriage;
    if (validated.triageNotes) existing.notes = validated.triageNotes;
    if (validated.triageLevel === 'CRITICAL' && (existing.status === 'WAITING' || existing.status === 'TRIAGED')) {
      existing.status = 'CRITICAL';
    }
    await existing.save();

    await logAudit({
      hospitalId: existing.hospitalId ? String(existing.hospitalId) : undefined,
      branchId: existing.branchId ? String(existing.branchId) : undefined,
      userId: user?.id,
      action: 'UPDATE_TRIAGE',
      resource: `EmergencyVisit:${id}`,
      details: `Updated triage level to ${validated.triageLevel} for ${existing.caseNumber}`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...existing.toObject(),
        id: String(existing._id),
        visitNumber: existing.caseNumber,
        triageLevel: validated.triageLevel,
      },
      disclaimer:
        'Triage categorization is clinical decision support and does not constitute independent medical advice. Final triage priority must be confirmed by authorized emergency medical personnel.',
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmergencyStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);
    const validated = updateEmergencyStatusSchema.parse(req.body);

    const existing = await EmergencyCase.findById(id);
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Emergency visit not found' });
      return;
    }

    existing.status = validated.status;
    if (validated.dischargeNotes) existing.notes = validated.dischargeNotes;
    if (validated.assignedDoctorId) existing.assignedDoctorId = validated.assignedDoctorId as any;
    await existing.save();

    await logAudit({
      hospitalId: existing.hospitalId ? String(existing.hospitalId) : undefined,
      branchId: existing.branchId ? String(existing.branchId) : undefined,
      userId: user?.id,
      action: 'UPDATE_EMERGENCY_STATUS',
      resource: `EmergencyVisit:${id}`,
      details: `Emergency visit #${existing.caseNumber} transitioned to status ${validated.status}`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...existing.toObject(),
        id: String(existing._id),
        visitNumber: existing.caseNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
