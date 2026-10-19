import { Request, Response, NextFunction } from 'express';
import { VitalsRecord, Patient } from '../models';
import { createVitalsSchema } from '../schemas/vitals.schema';
import { NotFoundError } from '../utils/errors';
import { logAudit } from '../utils/audit';

const formatVitalsRecord = (v: any) => {
  const obj = v.toObject ? v.toObject() : v;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
    bpSystolic: obj.systolicBp ?? obj.bpSystolic ?? null,
    bpDiastolic: obj.diastolicBp ?? obj.bpDiastolic ?? null,
    heartRate: obj.pulseRate ?? obj.heartRate ?? null,
    weight: obj.weight ?? obj.weightKg ?? null,
    weightKg: obj.weightKg ?? obj.weight ?? null,
    height: obj.height ?? obj.heightCm ?? null,
    heightCm: obj.heightCm ?? obj.height ?? null,
    recordedBy: obj.recordedBy,
    recordedById: obj.recordedBy?._id || obj.recordedBy,
  };
};

export const recordVitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.params.patientId || req.body.patientId;
    const bodyData = { ...req.body, patientId };
    const data = createVitalsSchema.parse(bodyData);

    const patient = await Patient.findById(data.patientId);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    const weightVal = data.weightKg ?? data.weight ?? null;
    const heightVal = data.heightCm ?? data.height ?? null;

    let bmi: number | null = null;
    if (weightVal && heightVal) {
      const heightInMeters = heightVal / 100;
      bmi = parseFloat((weightVal / (heightInMeters * heightInMeters)).toFixed(2));
    }

    const vitalsRecord = await VitalsRecord.create({
      hospitalId: patient.hospitalId || req.user?.hospitalId,
      patientId: data.patientId,
      recordedBy: req.user?.id || undefined,
      appointmentId: data.appointmentId || undefined,
      systolicBp: data.systolicBp ?? data.bpSystolic ?? undefined,
      diastolicBp: data.diastolicBp ?? data.bpDiastolic ?? undefined,
      pulseRate: data.pulseRate ?? data.heartRate ?? undefined,
      temperature: data.temperature ?? undefined,
      spo2: data.spo2 ?? data.spO2 ?? undefined,
      respiratoryRate: data.respiratoryRate ?? undefined,
      weight: weightVal ?? undefined,
      weightKg: weightVal ?? undefined,
      height: heightVal ?? undefined,
      heightCm: heightVal ?? undefined,
      bmi: bmi ?? undefined,
      bloodGlucose: data.bloodGlucose ?? undefined,
      notes: data.notes ?? undefined,
    });

    await logAudit({
      branchId: patient.branchId ? patient.branchId.toString() : undefined,
      userId: req.user?.id,
      action: 'VITALS_RECORDED',
      resource: 'vitals_records',
      details: `Recorded vitals for patient ${patient.firstName} ${patient.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Vitals recorded successfully.',
      data: { vitalsRecord: formatVitalsRecord(vitalsRecord) },
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientVitalsHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.params.patientId as string;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    const rawHistory = await VitalsRecord.find({ patientId })
      .populate('recordedBy', 'firstName lastName role')
      .sort({ createdAt: -1 });

    const vitalsHistory = rawHistory.map(formatVitalsRecord);

    res.status(200).json({
      status: 'success',
      data: { vitalsHistory },
    });
  } catch (err) {
    next(err);
  }
};

