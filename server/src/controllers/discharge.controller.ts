import { Request, Response, NextFunction } from 'express';
import { DischargeSummary, Admission, Bed, Invoice, Patient, Doctor, Hospital } from '../models';
import { logAudit } from '../utils/audit';
import { generateDischargePdf } from '../utils/dischargePdfGenerator';

export const finalizeDischarge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);
    const {
      finalDiagnosis,
      treatmentSummary,
      proceduresPerformed,
      dischargeCondition,
      dischargeMedications,
      dietInstructions,
      activityInstructions,
      urgentWarningSigns,
      followupDate,
      followupInstructions,
    } = req.body;

    const admission: any = await Admission.findById(id)
      .populate('bedId')
      .populate('patientId')
      .populate('doctorId');

    if (!admission || admission.status !== 'ADMITTED') {
      res.status(400).json({ status: 'error', message: 'Active admission not found or already discharged' });
      return;
    }

    const dischargeDate = new Date();
    const admissionDate = new Date(admission.admissionDate);
    const diffTime = Math.abs(dischargeDate.getTime() - admissionDate.getTime());
    const stayDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const bedRate = admission.bedId?.ratePerDay || 100;
    const totalBedCharges = bedRate * stayDays;
    const totalRoundsCharges = 0;
    const invoiceTotal = totalBedCharges + totalRoundsCharges;

    const year = new Date().getFullYear();
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-IPD-${year}-${String(invoiceCount + 1).padStart(5, '0')}`;

    const summary = await DischargeSummary.create({
      hospitalId: admission.hospitalId,
      admissionId: admission._id,
      patientId: admission.patientId?._id || admission.patientId,
      doctorId: admission.doctorId?._id || admission.doctorId,
      dischargeDate,
      summary: treatmentSummary || finalDiagnosis || 'Discharged',
      conditionAtDischarge: dischargeCondition || 'RECOVERED',
      instructions: followupInstructions || dietInstructions || '',
      followUpDate: followupDate ? new Date(followupDate) : undefined,
    });

    admission.status = 'DISCHARGED';
    admission.dischargeDate = dischargeDate;
    if (finalDiagnosis) admission.diagnosis = finalDiagnosis;
    await admission.save();

    if (admission.bedId) {
      await Bed.findByIdAndUpdate(admission.bedId._id || admission.bedId, {
        status: 'CLEANING',
        currentAdmissionId: null,
      });
    }

    const invoice = await Invoice.create({
      hospitalId: admission.hospitalId,
      branchId: admission.branchId,
      patientId: admission.patientId?._id || admission.patientId,
      doctorId: admission.doctorId?._id || admission.doctorId,
      invoiceNumber,
      items: [
        {
          description: `Inpatient Accommodation (${stayDays} days @ $${bedRate}/day)`,
          quantity: stayDays,
          unitPrice: bedRate,
          amount: totalBedCharges,
        },
      ],
      subtotal: invoiceTotal,
      discount: 0,
      tax: 0,
      total: invoiceTotal,
      status: 'UNPAID',
    });

    const patientName = admission.patientId
      ? `${admission.patientId.firstName} ${admission.patientId.lastName}`
      : 'Patient';

    await logAudit({
      hospitalId: admission.hospitalId ? String(admission.hospitalId) : undefined,
      branchId: admission.branchId ? String(admission.branchId) : undefined,
      userId: user?.id,
      action: 'DISCHARGE_PATIENT',
      resource: `AdmissionRecord:${admission._id}`,
      details: `Finalized discharge for patient ${patientName}. Invoice #${invoiceNumber} issued.`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          ...summary.toObject(),
          id: String(summary._id),
          dischargeMedications: JSON.stringify(dischargeMedications || []),
          admissionDiagnosis: admission.reason,
          finalDiagnosis,
          treatmentSummary,
          proceduresPerformed,
          dischargeCondition,
          dietInstructions,
          activityInstructions,
          urgentWarningSigns,
          followupDate,
          followupInstructions,
        },
        invoice: {
          ...invoice.toObject(),
          id: String(invoice._id),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDischargePdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);

    const admission: any = await Admission.findById(id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate('bedId')
      .populate('hospitalId');

    if (!admission) {
      res.status(404).json({ status: 'error', message: 'Admission record not found' });
      return;
    }

    const dischargeRecord = await DischargeSummary.findOne({ admissionId: id });
    if (!dischargeRecord) {
      res.status(404).json({ status: 'error', message: 'Finalized discharge summary not found for this admission' });
      return;
    }

    if (user?.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: user.id });
      if (!patient || String(patient._id) !== String(admission.patientId?._id || admission.patientId)) {
        res.status(403).json({ status: 'error', message: 'Unauthorized to access another patient discharge summary' });
        return;
      }
    }

    const pdfBuffer = await generateDischargePdf({
      admissionNumber: admission.admissionNumber,
      patient: admission.patientId,
      doctor: admission.doctorId,
      hospital: admission.hospitalId,
      wardName: 'General Ward',
      bedNumber: admission.bedId?.bedNumber,
      roomNumber: '101',
      admissionDate: admission.admissionDate,
      dischargeDate: admission.dischargeDate || new Date(),
      admissionReason: admission.reason,
      admissionDiagnosis: admission.diagnosis,
      finalDiagnosis: dischargeRecord.summary,
      treatmentSummary: dischargeRecord.summary,
      proceduresPerformed: 'None',
      dischargeCondition: dischargeRecord.conditionAtDischarge || 'RECOVERED',
      medications: [],
      dietInstructions: dischargeRecord.instructions,
      activityInstructions: '',
      urgentWarningSigns: '',
      followupDate: dischargeRecord.followUpDate,
      followupInstructions: dischargeRecord.instructions,
    });

    const patientName = admission.patientId
      ? `${admission.patientId.firstName} ${admission.patientId.lastName}`
      : 'Patient';

    await logAudit({
      hospitalId: admission.hospitalId ? String(admission.hospitalId) : undefined,
      branchId: admission.branchId ? String(admission.branchId) : undefined,
      userId: user?.id,
      action: 'DOWNLOAD_DISCHARGE_PDF',
      resource: `AdmissionRecord:${admission._id}`,
      details: `Generated discharge summary PDF for patient ${patientName}`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="discharge-summary-${admission.admissionNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
