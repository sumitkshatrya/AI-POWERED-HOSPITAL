import { Request, Response, NextFunction } from 'express';
import {
  Patient,
  Consultation,
  VitalsRecord,
  Prescription,
  LabOrder,
  RadiologyOrder,
  Admission,
  DocumentModel,
  MedicalRecord,
} from '../models';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { logAudit } from '../utils/audit';
import { Role } from '../types/roles';

export interface TimelineEvent {
  id: string;
  eventType: 'CONSULTATION' | 'VITALS' | 'PRESCRIPTION' | 'LAB_ORDER' | 'RADIOLOGY' | 'PROCEDURE' | 'ADMISSION' | 'DOCUMENT';
  timestamp: Date | string;
  title: string;
  summary: string;
  details: any;
}

export const getEmrTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.params.patientId as string;

    const patient: any = await Patient.findById(patientId).lean();
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    // Security Check: Patient can ONLY access their own timeline
    if (req.user?.role === Role.PATIENT && patient.userId && patient.userId.toString() !== req.user.id) {
      throw new ForbiddenError('You are not authorized to view this EMR timeline.');
    }

    const [
      consultations,
      vitalsRecords,
      prescriptions,
      labOrders,
      radiologyReports,
      admissions,
      documents,
      medicalRecords,
    ] = await Promise.all([
      Consultation.find({ patientId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
        .lean(),
      VitalsRecord.find({ patientId })
        .populate('recordedBy', 'firstName lastName')
        .lean(),
      Prescription.find({ patientId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
        .lean(),
      LabOrder.find({ patientId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
        .lean(),
      RadiologyOrder.find({ patientId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
        .lean(),
      Admission.find({ patientId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
        .lean(),
      DocumentModel.find({ patientId })
        .populate('uploadedBy', 'firstName lastName')
        .lean(),
      MedicalRecord.find({ patientId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
        .lean(),
    ]);

    const timeline: TimelineEvent[] = [];

    // 1. Consultations
    (consultations || []).forEach((c: any) => {
      timeline.push({
        id: `consultation-${c._id}`,
        eventType: 'CONSULTATION',
        timestamp: c.createdAt,
        title: `Clinical Consultation (${c.status || 'COMPLETED'})`,
        summary: `Chief Complaints: ${c.chiefComplaint || c.chiefComplaints || 'N/A'}`,
        details: c,
      });
    });

    // 2. Vitals
    (vitalsRecords || []).forEach((v: any) => {
      timeline.push({
        id: `vitals-${v._id}`,
        eventType: 'VITALS',
        timestamp: v.recordedAt || v.createdAt,
        title: 'Nurse Vitals Triage',
        summary: `BP: ${v.bloodPressureSystolic || v.systolicBp || '-'}/${v.bloodPressureDiastolic || v.diastolicBp || '-'} mmHg | HR: ${v.pulseRate || v.heartRate || '-'} bpm | Temp: ${v.temperature || '-'}°F | SpO2: ${v.oxygenSaturation || '-'}%`,
        details: v,
      });
    });

    // 3. Prescriptions
    (prescriptions || []).forEach((p: any) => {
      const medList = (p.medicines || p.items || []).map((i: any) => `${i.medicineName || i.name} (${i.dosage || ''})`).join(', ');
      timeline.push({
        id: `prescription-${p._id}`,
        eventType: 'PRESCRIPTION',
        timestamp: p.createdAt,
        title: `e-Prescription (${p.prescriptionNumber || p.prescriptionCode || p._id.toString().slice(-6)})`,
        summary: `Medicines: ${medList || 'Standard medication'}`,
        details: p,
      });
    });

    // 4. Lab Orders
    (labOrders || []).forEach((l: any) => {
      const tests = (l.tests || l.items || []).map((i: any) => i.testName || i.name).join(', ');
      timeline.push({
        id: `lab-${l._id}`,
        eventType: 'LAB_ORDER',
        timestamp: l.createdAt,
        title: `Lab Investigation Order (${l.orderNumber || l._id.toString().slice(-6)})`,
        summary: `Tests: ${tests || 'Diagnostic panel'} | Status: ${l.status}`,
        details: l,
      });
    });

    // 5. Radiology Reports
    (radiologyReports || []).forEach((r: any) => {
      timeline.push({
        id: `radiology-${r._id}`,
        eventType: 'RADIOLOGY',
        timestamp: r.createdAt,
        title: `Radiology Imaging: ${r.imagingType || 'X-Ray'} (${r.bodyPart || 'Standard'})`,
        summary: `Findings: ${(r.findings || 'Report completed').substring(0, 100)}...`,
        details: r,
      });
    });

    // 6. Procedures / Medical Records
    (medicalRecords || []).forEach((pr: any) => {
      timeline.push({
        id: `procedure-${pr._id}`,
        eventType: 'PROCEDURE',
        timestamp: pr.recordDate || pr.createdAt,
        title: `Medical Record: ${pr.title || pr.recordType}`,
        summary: pr.description || 'Record logged successfully.',
        details: pr,
      });
    });

    // 7. Admissions
    (admissions || []).forEach((ad: any) => {
      timeline.push({
        id: `admission-${ad._id}`,
        eventType: 'ADMISSION',
        timestamp: ad.admissionDate || ad.createdAt,
        title: `Hospital Inpatient Admission (${ad.status})`,
        summary: `Reason: ${ad.reason || 'Medical care'} | Admission #: ${ad.admissionNumber || 'N/A'}`,
        details: ad,
      });
    });

    // 8. Documents
    (documents || []).forEach((d: any) => {
      timeline.push({
        id: `document-${d._id}`,
        eventType: 'DOCUMENT',
        timestamp: d.createdAt,
        title: `Medical Document: ${d.fileName || d.type}`,
        summary: `Type: ${d.type} | Size: ${((d.size || 0) / 1024).toFixed(1)} KB`,
        details: d,
      });
    });

    // Reverse Chronological Sort (newest first)
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    await logAudit({
      userId: req.user?.id,
      action: 'EMR_VIEWED',
      resource: 'patients',
      details: `Viewed full EMR timeline for patient ${patient.uhid}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      data: {
        patient: {
          id: patient._id.toString(),
          uhid: patient.uhid,
          mrn: patient.mrn,
          firstName: patient.firstName,
          lastName: patient.lastName,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
          bloodGroup: patient.bloodGroup,
          allergies: patient.allergies || [],
          chronicConditions: patient.chronicConditions || [],
        },
        timeline,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const recordRadiologyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req.params.patientId || req.body.patientId) as string;
    const { imagingType, studyType, bodyPart, findings, impression, doctorId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found.');
    }

    const report = await RadiologyOrder.create({
      hospitalId: (req as any).user?.hospitalId || patient.hospitalId,
      branchId: (req as any).user?.branchId || patient.branchId,
      patientId,
      doctorId: doctorId || undefined,
      orderNumber: `RAD-${Date.now()}`,
      imagingType: imagingType || studyType || 'XRAY',
      bodyPart: bodyPart || 'Chest',
      findings,
      impression: impression || undefined,
      status: 'COMPLETED',
    });

    res.status(201).json({ status: 'success', data: { radiologyReport: report } });
  } catch (err) {
    next(err);
  }
};

export const recordProcedure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req.params.patientId || req.body.patientId) as string;
    const { procedureName, procedureDate, performedAt, notes, doctorId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found.');
    }

    const proc = await MedicalRecord.create({
      hospitalId: (req as any).user?.hospitalId || patient.hospitalId,
      patientId,
      doctorId: doctorId || undefined,
      title: procedureName || 'Clinical Procedure',
      recordType: 'PROCEDURE',
      description: notes || 'Procedure performed.',
      recordDate: (procedureDate || performedAt) ? new Date(procedureDate || performedAt) : new Date(),
    });

    res.status(201).json({ status: 'success', data: { procedure: proc } });
  } catch (err) {
    next(err);
  }
};

export const recordAdmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req.params.patientId || req.body.patientId) as string;
    const { admissionReason, reason, dischargeSummary, doctorId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found.');
    }

    const admission = await Admission.create({
      hospitalId: (req as any).user?.hospitalId || patient.hospitalId,
      branchId: (req as any).user?.branchId || patient.branchId,
      patientId,
      doctorId: doctorId || undefined,
      admissionNumber: `ADM-${Date.now()}`,
      reason: admissionReason || reason || 'Hospital Admission',
      diagnosis: dischargeSummary || undefined,
      status: 'ADMITTED',
    });

    res.status(201).json({ status: 'success', data: { admission } });
  } catch (err) {
    next(err);
  }
};
