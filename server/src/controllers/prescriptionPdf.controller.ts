import { Request, Response, NextFunction } from 'express';
import { Prescription, Hospital } from '../models';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { generatePrescriptionPdfBuffer } from '../utils/pdfGenerator';
import { logAudit } from '../utils/audit';
import { Role } from '../types/roles';

export const getPrescriptionPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const prescription: any = await Prescription.findById(id)
      .populate({
        path: 'patientId',
        select: '_id userId firstName lastName uhid gender dateOfBirth',
      })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'firstName lastName' },
          { path: 'hospitalId', select: 'name contactEmail contactPhone address' },
        ],
      })
      .populate('consultationId')
      .lean();

    if (!prescription) {
      throw new NotFoundError('Prescription record not found.');
    }

    const patient = prescription.patientId;
    const doctor = prescription.doctorId;

    // Security Check: Patient user can ONLY download their own prescription PDF
    if (req.user?.role === Role.PATIENT) {
      if (patient?.userId && patient.userId.toString() !== req.user.id) {
        throw new ForbiddenError('You are not authorized to access this prescription document.');
      }
    }

    const hospitalData = {
      name: doctor?.hospitalId?.name || 'MediQuick City Hospital',
      contactEmail: doctor?.hospitalId?.contactEmail || 'contact@mediquick.com',
      contactPhone: doctor?.hospitalId?.contactPhone || '+1-800-MED-QUICK',
      address: doctor?.hospitalId?.address || '100 Healthcare Boulevard',
    };

    const doctorData = {
      name: doctor?.userId ? `${doctor.userId.firstName} ${doctor.userId.lastName}` : 'Doctor',
      qualification: doctor?.qualification || doctor?.specialization || 'MBBS, MD',
      specialization: doctor?.specialization || 'General Medicine',
      registrationNumber: doctor?.licenseNumber || doctor?.registrationNumber || 'REG-DOC-1001',
    };

    const patientData = {
      name: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient',
      uhid: patient?.uhid || 'N/A',
      gender: patient?.gender || 'N/A',
      dateOfBirth: patient?.dateOfBirth,
    };

    const items = (prescription.medicines || prescription.items || []).map((m: any) => ({
      medicineName: m.name || m.medicineName || 'Medicine',
      dosage: m.dose || m.dosage || '1 tab',
      frequency: m.frequency || 'Once daily',
      durationDays: parseInt(m.duration, 10) || 5,
      route: m.route || 'Oral',
      instructions: m.instructions || '',
    }));

    const prescriptionCode = `RX-${prescription._id.toString().slice(-6).toUpperCase()}`;

    const pdfBuffer = await generatePrescriptionPdfBuffer({
      prescriptionCode,
      createdAt: prescription.createdAt,
      adviceInstructions: prescription.doctorInstructions || prescription.adviceInstructions,
      hospital: hospitalData,
      doctor: doctorData,
      patient: patientData,
      items,
      followupDate: prescription.followUpDate || prescription.consultationId?.followUpDate,
    });

    await logAudit({
      userId: req.user?.id,
      action: 'PRESCRIPTION_PDF_GENERATED',
      resource: 'prescriptions',
      details: `Generated PDF for prescription ${prescriptionCode}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Prescription-${prescriptionCode}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
