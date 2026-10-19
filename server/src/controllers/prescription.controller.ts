import { Request, Response, NextFunction } from 'express';
import { Prescription } from '../models';
import { NotFoundError } from '../utils/errors';

export const getPrescriptionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const prescription = await Prescription.findById(id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
      .populate('consultationId');

    if (!prescription) {
      throw new NotFoundError('Prescription record not found.');
    }

    const patientObj: any = prescription.patientId && typeof prescription.patientId === 'object' ? prescription.patientId : null;
    const docObj: any = prescription.doctorId && typeof prescription.doctorId === 'object' ? prescription.doctorId : null;
    const userObj: any = docObj && docObj.userId && typeof docObj.userId === 'object' ? docObj.userId : null;
    const deptObj: any = docObj && docObj.departmentId && typeof docObj.departmentId === 'object' ? docObj.departmentId : null;
    const consultObj: any = prescription.consultationId && typeof prescription.consultationId === 'object' ? prescription.consultationId : null;

    res.status(200).json({
      status: 'success',
      data: {
        prescription: {
          id: prescription._id.toString(),
          _id: prescription._id,
          hospitalId: prescription.hospitalId?.toString() || null,
          doctorId: docObj ? docObj._id.toString() : prescription.doctorId?.toString() || null,
          patientId: patientObj ? patientObj._id.toString() : prescription.patientId?.toString() || null,
          consultationId: consultObj ? consultObj._id.toString() : prescription.consultationId?.toString() || null,
          prescriptionCode: `RX-${prescription._id.toString().substring(18).toUpperCase()}`,
          doctorInstructions: prescription.doctorInstructions || null,
          adviceInstructions: prescription.doctorInstructions || null,
          status: prescription.status,
          createdAt: prescription.createdAt,
          updatedAt: prescription.updatedAt,
          items: (prescription.medicines || []).map((m: any) => ({
            id: m._id ? m._id.toString() : m.name,
            medicineName: m.name,
            name: m.name,
            dosage: m.dose,
            dose: m.dose,
            frequency: m.frequency,
            durationDays: m.duration,
            duration: m.duration,
            route: m.route || 'Oral',
            instructions: m.instructions || null,
          })),
          patient: patientObj
            ? {
                id: patientObj._id.toString(),
                uhid: patientObj.patientId || patientObj.mrn,
                firstName: patientObj.firstName,
                lastName: patientObj.lastName,
                phone: patientObj.phone,
              }
            : null,
          doctor: docObj
            ? {
                id: docObj._id.toString(),
                user: userObj ? { firstName: userObj.firstName, lastName: userObj.lastName, phone: userObj.phone } : null,
                department: deptObj ? { name: deptObj.name } : null,
              }
            : null,
          consultation: consultObj
            ? {
                chiefComplaints: consultObj.chiefComplaint || '',
                vitals: consultObj.vitals || {},
                diagnosisCodes: consultObj.diagnosis || [],
                createdAt: consultObj.createdAt,
              }
            : null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
