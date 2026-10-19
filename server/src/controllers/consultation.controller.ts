import { Request, Response, NextFunction } from 'express';
import { Consultation, Appointment, Patient, Doctor, Prescription, Invoice, LabOrder } from '../models';
import { createConsultationSchema } from '../schemas/consultation.schema';
import { logAudit } from '../utils/audit';
import { ConflictError, NotFoundError } from '../utils/errors';
import { safeJsonParseArray, safeJsonParseObject } from '../utils/json';
import { getIO } from '../socket';

const formatConsultation = (c: any) => {
  const patientObj: any = c.patientId && typeof c.patientId === 'object' ? c.patientId : null;
  const docObj: any = c.doctorId && typeof c.doctorId === 'object' ? c.doctorId : null;
  const userObj: any = docObj && docObj.userId && typeof docObj.userId === 'object' ? docObj.userId : null;

  return {
    id: c._id ? c._id.toString() : c.id,
    _id: c._id,
    hospitalId: c.hospitalId?._id ? c.hospitalId._id.toString() : c.hospitalId?.toString() || null,
    doctorId: docObj ? docObj._id.toString() : c.doctorId?.toString() || null,
    patientId: patientObj ? patientObj._id.toString() : c.patientId?.toString() || null,
    appointmentId: c.appointmentId?._id ? c.appointmentId._id.toString() : c.appointmentId?.toString() || null,
    chiefComplaints: c.chiefComplaint || '',
    chiefComplaint: c.chiefComplaint || '',
    symptoms: c.symptoms || [],
    examinationNotes: c.examination || null,
    clinicalFindings: c.examination || null,
    assessment: c.assessment || null,
    diagnosisCodes: c.diagnosis || [],
    diagnosis: c.diagnosis || [],
    treatmentPlan: c.treatmentPlan || null,
    followupDate: c.followUpDate || null,
    vitals: c.vitals || {},
    soapNotes: { assessment: c.assessment, treatmentPlan: c.treatmentPlan },
    isDraft: c.status === 'DRAFT',
    status: c.status,
    patient: patientObj
      ? {
          id: patientObj._id.toString(),
          uhid: patientObj.patientId || patientObj.mrn,
          firstName: patientObj.firstName,
          lastName: patientObj.lastName,
          gender: patientObj.gender,
          dateOfBirth: patientObj.dateOfBirth,
          bloodGroup: patientObj.bloodGroup,
        }
      : null,
    doctor: docObj
      ? {
          id: docObj._id.toString(),
          user: userObj ? { firstName: userObj.firstName, lastName: userObj.lastName } : null,
        }
      : null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

export const createConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createConsultationSchema.parse(req.body);

    const appointment = await Appointment.findById(data.appointmentId)
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .populate('patientId');

    if (!appointment) {
      throw new NotFoundError('Appointment record not found.');
    }

    const existing = await Consultation.findOne({ appointmentId: data.appointmentId });

    if (existing && existing.status === 'FINAL') {
      throw new ConflictError('Consultation has already been finalized for this appointment.');
    }

    const isFinal = data.status === 'FINAL' && !data.isDraft;
    const prescriptionCode = `RX-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const consultationObj = {
      hospitalId: appointment.hospitalId,
      doctorId: data.doctorId,
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      chiefComplaint: data.chiefComplaints,
      symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
      examination: data.clinicalFindings || data.examinationNotes,
      assessment: data.assessment,
      diagnosis: Array.isArray(data.diagnosisCodes) ? data.diagnosisCodes : [],
      treatmentPlan: data.treatmentPlan,
      followUpDate: data.followupDate ? new Date(data.followupDate) : undefined,
      vitals: data.vitals || {},
      status: isFinal ? 'FINAL' : 'DRAFT',
    };

    let consultation;

    if (existing) {
      consultation = await Consultation.findByIdAndUpdate(existing._id, { $set: consultationObj }, { new: true })
        .populate('patientId')
        .populate({ path: 'doctorId', populate: { path: 'userId' } });
    } else {
      const created = await Consultation.create(consultationObj);
      consultation = await Consultation.findById(created._id)
        .populate('patientId')
        .populate({ path: 'doctorId', populate: { path: 'userId' } });
    }

    if (!consultation) {
      throw new NotFoundError('Failed to save consultation record.');
    }

    if (isFinal) {
      // 1. e-Prescription creation
      if (data.prescription && data.prescription.items && data.prescription.items.length > 0) {
        await Prescription.create({
          hospitalId: appointment.hospitalId,
          doctorId: data.doctorId,
          patientId: data.patientId,
          consultationId: consultation._id,
          appointmentId: appointment._id,
          doctorInstructions: data.prescription.adviceInstructions || null,
          medicines: data.prescription.items.map((item: any) => ({
            name: item.medicineName,
            dose: item.dosage,
            frequency: item.frequency,
            duration: `${item.durationDays || 5} days`,
            route: item.route || 'Oral',
            instructions: item.instructions || null,
          })),
          status: 'ACTIVE',
        });
      }

      // 2. Lab Order creation
      if (data.labOrders && data.labOrders.length > 0 && LabOrder) {
        const year = new Date().getFullYear();
        const count = await LabOrder.countDocuments();
        const orderNumber = `LAB-${year}-${(count + 1).toString().padStart(4, '0')}`;
        const totalFee = data.labOrders.reduce((acc: number, l: any) => acc + (l.price || 50), 0);

        await LabOrder.create({
          hospitalId: appointment.hospitalId,
          branchId: appointment.branchId,
          patientId: data.patientId,
          doctorId: data.doctorId,
          consultationId: consultation._id,
          orderNumber,
          totalFee,
          status: 'PENDING',
          tests: data.labOrders.map((l: any) => ({
            testName: l.testName,
            testCode: l.testCode || `TEST-${l.testName.substring(0, 3).toUpperCase()}`,
            specimenType: l.specimenType || 'BLOOD',
            status: 'PENDING',
          })),
        });
      }

      // 3. Billing Invoice Auto-Generation
      if (Invoice) {
        const consultFee = appointment.consultationFee || 50.0;
        const invCount = await Invoice.countDocuments();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(invCount + 1).toString().padStart(4, '0')}`;

        await Invoice.create({
          hospitalId: appointment.hospitalId,
          branchId: appointment.branchId,
          patientId: data.patientId,
          appointmentId: data.appointmentId,
          consultationId: consultation._id,
          invoiceNumber,
          totalAmount: consultFee,
          paymentStatus: 'UNPAID',
          items: [
            {
              description: 'OPD Consultation Fee',
              quantity: 1,
              unitPrice: consultFee,
              totalPrice: consultFee,
            },
          ],
        });
      }

      // 4. Update appointment status to COMPLETED
      await Appointment.findByIdAndUpdate(data.appointmentId, { $set: { status: 'COMPLETED' } });

      try {
        const io = getIO();
        io.emit('opd:queue-updated', { branchId: appointment.branchId?.toString(), doctorId: data.doctorId });
      } catch {
        // Socket emission failure non-fatal
      }

      await logAudit({
        branchId: appointment.branchId?.toString(),
        userId: req.user?.id,
        action: 'CONSULTATION_FINALIZED',
        resource: 'consultations',
        details: `Finalized consultation for appointment ${appointment._id}. e-Prescription & Invoice auto-generated.`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    res.status(isFinal ? 201 : 200).json({
      status: 'success',
      message: isFinal ? 'Consultation finalized, prescription & invoice issued.' : 'Consultation draft saved successfully.',
      data: { consultation: formatConsultation(consultation) },
    });
  } catch (err) {
    next(err);
  }
};

export const getConsultationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const consultation = await Consultation.findById(id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } });

    if (!consultation) {
      throw new NotFoundError('Consultation record not found.');
    }

    res.status(200).json({
      status: 'success',
      data: {
        consultation: formatConsultation(consultation),
      },
    });
  } catch (err) {
    next(err);
  }
};
