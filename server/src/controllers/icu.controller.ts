import { Request, Response, NextFunction } from 'express';
import { ICUAdmission, Admission, Patient, Bed, Ward } from '../models';
import { logAudit } from '../utils/audit';

export const getIcuDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hospitalId = req.user?.hospitalId;
    const branchId = req.user?.branchId;

    const query: any = {};
    if (hospitalId && req.user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && req.user?.role !== 'SUPER_ADMIN') {
      query.$or = [{ branchId: String(branchId) }, { branchId: null }];
    }

    const icuBeds = await Bed.find(query).populate('wardId').lean();

    const bedIds = icuBeds.map((b: any) => b._id);

    const activeAdmissions = await Admission.find({
      bedId: { $in: bedIds },
      status: 'ADMITTED',
    })
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
      .lean();

    const admissionIds = activeAdmissions.map((a: any) => a._id);
    const icuAdmissions = await ICUAdmission.find({
      admissionId: { $in: admissionIds },
    }).lean();

    const totalIcuBeds = icuBeds.length;
    const occupiedIcuBeds = icuBeds.filter((b: any) => b.status === 'OCCUPIED').length;
    const availableIcuBeds = icuBeds.filter((b: any) => b.status === 'AVAILABLE').length;

    let criticalAlertsCount = 0;
    let ventilatorPatientsCount = 0;

    const activePatients = activeAdmissions.map((admission: any) => {
      const icuDoc = icuAdmissions.find((i: any) => String(i.admissionId) === String(admission._id));
      if (icuDoc?.ventilatorRequired) {
        ventilatorPatientsCount++;
      }

      const bed: any = icuBeds.find((b: any) => String(b._id) === String(admission.bedId)) || {};
      const patient: any = admission.patientId ? { ...admission.patientId, id: String((admission.patientId as any)._id) } : null;
      const doctor: any = admission.doctorId ? { ...admission.doctorId, id: String((admission.doctorId as any)._id) } : null;

      return {
        bedId: String(admission.bedId),
        bedNumber: bed.bedNumber || 'ICU-Bed',
        roomNumber: bed.roomNumber || 'ICU-101',
        wardName: (bed.wardId as any)?.name || 'ICU Ward',
        admissionId: String(admission._id),
        admissionNumber: admission.admissionNumber,
        admissionDate: admission.admissionDate,
        admissionReason: admission.reason,
        patient,
        doctor,
        latestTelemetry: icuDoc || null,
        recentTelemetry: icuDoc ? [icuDoc] : [],
        upcomingMedications: [],
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalIcuBeds,
          occupiedIcuBeds,
          availableIcuBeds,
          occupancyRate: totalIcuBeds > 0 ? Math.round((occupiedIcuBeds / totalIcuBeds) * 100) : 0,
          criticalAlertsCount,
          ventilatorPatientsCount,
        },
        icuBeds: icuBeds.map((b: any) => ({ ...b, id: String(b._id) })),
        activePatients,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const recordIcuTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const {
      heartRate,
      systolicBp,
      diastolicBp,
      spo2,
      respiratoryRate,
      temperature,
      ventilatorMode,
      fio2,
      peep,
      gcsScore,
      alertLevel: customAlertLevel,
      telemetryNotes,
    } = req.body;

    const admission: any = await Admission.findById(id).populate('patientId');

    if (!admission || admission.status !== 'ADMITTED') {
      res.status(400).json({ status: 'error', message: 'Active admission not found for telemetry monitoring' });
      return;
    }

    let computedAlertLevel = customAlertLevel || 'NORMAL';
    if (!customAlertLevel) {
      if (
        (spo2 !== undefined && spo2 < 90) ||
        (systolicBp !== undefined && systolicBp < 90) ||
        (heartRate !== undefined && (heartRate > 130 || heartRate < 45)) ||
        (gcsScore !== undefined && gcsScore <= 8)
      ) {
        computedAlertLevel = 'CRITICAL';
      } else if (
        (spo2 !== undefined && spo2 < 94) ||
        (systolicBp !== undefined && systolicBp > 160) ||
        (temperature !== undefined && temperature > 38.5)
      ) {
        computedAlertLevel = 'WARNING';
      }
    }

    let icuRecord = await ICUAdmission.findOne({ admissionId: id });
    if (!icuRecord) {
      icuRecord = await ICUAdmission.create({
        hospitalId: admission.hospitalId,
        admissionId: id,
        patientId: admission.patientId?._id || admission.patientId,
        icuBedNumber: admission.bedNumber || 'ICU-01',
        entryDate: new Date(),
        ventilatorRequired: ventilatorMode && ventilatorMode !== 'NONE',
        notes: telemetryNotes,
      });
    } else {
      icuRecord.ventilatorRequired = ventilatorMode && ventilatorMode !== 'NONE';
      if (telemetryNotes) icuRecord.notes = telemetryNotes;
      await icuRecord.save();
    }

    const telemetry = {
      id: `TEL-${Date.now()}`,
      admissionId: id,
      bedId: String(admission.bedId),
      heartRate,
      systolicBp,
      diastolicBp,
      spo2,
      respiratoryRate,
      temperature,
      ventilatorMode: ventilatorMode || 'NONE',
      fio2,
      peep,
      gcsScore,
      alertLevel: computedAlertLevel,
      telemetryNotes,
      createdAt: new Date(),
    };

    if (computedAlertLevel === 'CRITICAL') {
      const patientName = admission.patientId
        ? `${admission.patientId.firstName} ${admission.patientId.lastName}`
        : 'Patient';

      await logAudit({
        hospitalId: admission.hospitalId ? String(admission.hospitalId) : undefined,
        branchId: admission.branchId ? String(admission.branchId) : undefined,
        userId: req.user?.id,
        action: 'CRITICAL_ICU_ALERT',
        resource: `AdmissionRecord:${admission._id}`,
        details: `Critical vitals alert triggered for patient ${patientName}. HR:${heartRate || '-'}, SpO2:${spo2 || '-'}%, BP:${systolicBp || '-'}/${diastolicBp || '-'}`,
      });
    }

    res.status(201).json({
      status: 'success',
      data: telemetry,
    });
  } catch (error) {
    next(error);
  }
};
