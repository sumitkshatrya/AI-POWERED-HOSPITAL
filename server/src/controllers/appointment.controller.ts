import { Request, Response, NextFunction } from 'express';
import { Appointment, Doctor, Patient, DoctorSchedule } from '../models';
import {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../schemas/appointment.schema';
import { calculateDoctorSlots, getUTCStartAndEndOfDay } from '../utils/availability';
import { logAudit } from '../utils/audit';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { Role } from '../types/roles';

const formatAppointment = (a: any) => {
  const patientObj: any = a.patientId && typeof a.patientId === 'object' ? a.patientId : null;
  const docObj: any = a.doctorId && typeof a.doctorId === 'object' ? a.doctorId : null;
  const userObj: any = docObj && docObj.userId && typeof docObj.userId === 'object' ? docObj.userId : null;
  const branchObj: any = a.branchId && typeof a.branchId === 'object' ? a.branchId : null;
  const deptObj: any = a.departmentId && typeof a.departmentId === 'object' ? a.departmentId : null;

  return {
    id: a._id ? a._id.toString() : a.id,
    _id: a._id,
    hospitalId: a.hospitalId?._id ? a.hospitalId._id.toString() : a.hospitalId?.toString() || null,
    branchId: branchObj ? branchObj._id.toString() : a.branchId?.toString() || null,
    doctorId: docObj ? docObj._id.toString() : a.doctorId?.toString() || null,
    patientId: patientObj ? patientObj._id.toString() : a.patientId?.toString() || null,
    departmentId: deptObj ? deptObj._id.toString() : a.departmentId?.toString() || null,
    appointmentDate: a.appointmentDate,
    slotStartTime: a.startTime || a.slotStartTime || '',
    slotEndTime: a.endTime || a.slotEndTime || '',
    startTime: a.startTime || a.slotStartTime || '',
    endTime: a.endTime || a.slotEndTime || '',
    appointmentType: a.type || a.appointmentType || 'IN_PERSON',
    type: a.type || a.appointmentType || 'IN_PERSON',
    reasonForVisit: a.notes || a.reasonForVisit || null,
    notes: a.notes || a.reasonForVisit || null,
    fee: a.consultationFee ?? a.fee ?? 0,
    consultationFee: a.consultationFee ?? a.fee ?? 0,
    status: a.status,
    cancelReason: a.notes || null,
    tokenNumber: a.tokenNumber || null,
    patient: patientObj
      ? {
          id: patientObj._id.toString(),
          uhid: patientObj.patientId || patientObj.mrn,
          firstName: patientObj.firstName,
          lastName: patientObj.lastName,
          phone: patientObj.phone,
          bloodGroup: patientObj.bloodGroup,
          allergies: patientObj.allergies || [],
          userId: patientObj.userId?._id ? patientObj.userId._id.toString() : patientObj.userId?.toString() || null,
        }
      : null,
    doctor: docObj
      ? {
          id: docObj._id.toString(),
          specialization: docObj.specialization,
          consultationFee: docObj.consultationFee,
          user: userObj ? { firstName: userObj.firstName, lastName: userObj.lastName } : null,
          department: deptObj ? { id: deptObj._id.toString(), name: deptObj.name } : null,
        }
      : null,
    branch: branchObj ? { id: branchObj._id.toString(), name: branchObj.name } : null,
    department: deptObj ? { id: deptObj._id.toString(), name: deptObj.name } : null,
  };
};

export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createAppointmentSchema.parse(req.body);

    const doctor = await Doctor.findById(data.doctorId).populate('userId').populate('departmentId');
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found.');
    }

    const patient = await Patient.findById(data.patientId);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    // Security check for PATIENT role
    if (req.user?.role === Role.PATIENT) {
      const isSelfBooking = patient.userId && patient.userId.toString() === req.user.id;
      if (!isSelfBooking) {
        throw new ForbiddenError('Patients can only book appointments for themselves.');
      }
    }

    // Date parsing and past date validation
    const apptDateObj = new Date(data.appointmentDate);
    if (isNaN(apptDateObj.getTime())) {
      throw new ValidationError('Invalid appointment date format.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDateStr = apptDateObj.toISOString().split('T')[0];

    // Block past dates unless EMERGENCY
    if (targetDateStr < todayStr && data.appointmentType !== 'EMERGENCY') {
      throw new ValidationError('Cannot book appointments for past dates.');
    }

    // Calculate Availability
    const availability = await calculateDoctorSlots(data.doctorId, targetDateStr);

    if (!availability.isWorkingDay) {
      throw new ValidationError('Doctor does not work on this day of the week.');
    }

    if (availability.isOnLeave) {
      throw new ValidationError('Doctor is on leave on the selected date.');
    }

    if (availability.isHoliday) {
      throw new ValidationError('Hospital/Doctor is on holiday on the selected date.');
    }

    if (availability.totalBooked >= availability.maxAppointmentsPerDay) {
      throw new ValidationError(`Doctor has reached the maximum appointment limit (${availability.maxAppointmentsPerDay}) for this day.`);
    }

    // Convert time strings to minutes for range validation
    const timeToMinutes = (tStr: string) => {
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };

    const reqStart = timeToMinutes(data.slotStartTime);
    const reqEnd = timeToMinutes(data.slotEndTime);

    const schedule = await DoctorSchedule.findOne({ doctorId: data.doctorId });
    const breakStart = schedule?.breaks?.[0]?.startTime ? timeToMinutes(schedule.breaks[0].startTime) : 13 * 60;
    const breakEnd = schedule?.breaks?.[0]?.endTime ? timeToMinutes(schedule.breaks[0].endTime) : 14 * 60;

    // Check if slot overlaps doctor break time
    if (reqStart < breakEnd && reqEnd > breakStart) {
      throw new ValidationError('Cannot book an appointment during doctor break time.');
    }

    // Double Booking Overlap Guard for Doctor
    const { startOfDay, endOfDay } = getUTCStartAndEndOfDay(targetDateStr);

    const doctorOverlap = await Appointment.findOne({
      doctorId: data.doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'CANCELLED' },
      startTime: data.slotStartTime,
      endTime: data.slotEndTime,
    });

    if (doctorOverlap) {
      throw new ValidationError('Double booking error: Doctor is already booked for this exact time slot.');
    }

    // Double Booking Guard for Patient
    const patientOverlap = await Appointment.findOne({
      patientId: data.patientId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'CANCELLED' },
      startTime: data.slotStartTime,
      endTime: data.slotEndTime,
    });

    if (patientOverlap) {
      throw new ValidationError('Double booking error: Patient already has another appointment at this time slot.');
    }

    const created = await Appointment.create({
      hospitalId: data.hospitalId || doctor.hospitalId || patient.hospitalId,
      branchId: data.branchId || doctor.branchId || patient.branchId,
      departmentId: data.departmentId || doctor.departmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate: apptDateObj,
      startTime: data.slotStartTime,
      endTime: data.slotEndTime,
      type: data.appointmentType,
      notes: data.reasonForVisit,
      consultationFee: data.fee ?? doctor.consultationFee ?? 50.0,
      status: 'SCHEDULED',
    });

    const appointment = await Appointment.findById(created._id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
      .populate('branchId')
      .populate('departmentId');

    await logAudit({
      branchId: created.branchId?.toString(),
      userId: req.user?.id,
      action: 'APPOINTMENT_CREATED',
      resource: 'appointments',
      details: `Scheduled ${data.appointmentType} appointment for ${patient.firstName} ${patient.lastName} on ${targetDateStr} ${data.slotStartTime}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Appointment booked successfully.',
      data: { appointment: formatAppointment(appointment) },
    });
  } catch (err) {
    next(err);
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = (req.query.doctorId as string) || (req.params.doctorId as string);
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];

    if (!doctorId) {
      throw new ValidationError('Doctor ID parameter is required.');
    }

    const result = await calculateDoctorSlots(doctorId, dateStr);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, hospitalId, doctorId, patientId, date, startDate, endDate, status } = req.query;

    const query: any = {};

    // Patient Security Filter
    if (req.user?.role === Role.PATIENT) {
      const patientRecord = await Patient.findOne({ userId: req.user.id });
      if (!patientRecord) {
        res.status(200).json({ status: 'success', data: { appointments: [] } });
        return;
      }
      query.patientId = patientRecord._id;
    } else {
      if (branchId) query.branchId = branchId as string;
      if (hospitalId) query.hospitalId = hospitalId as string;
      if (patientId) query.patientId = patientId as string;
    }

    if (doctorId) query.doctorId = doctorId as string;
    if (status) query.status = status as string;

    if (date) {
      const d = new Date(date as string);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      const s = new Date(startDate as string);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate as string);
      e.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: s, $lte: e };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
      .populate('branchId')
      .populate('departmentId')
      .sort({ appointmentDate: 1, startTime: 1 });

    const formatted = appointments.map(formatAppointment);

    res.status(200).json({
      status: 'success',
      data: { appointments: formatted },
    });
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const appointment = await Appointment.findById(id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: [{ path: 'userId' }, { path: 'departmentId' }] })
      .populate('branchId')
      .populate('departmentId');

    if (!appointment) {
      throw new NotFoundError('Appointment not found.');
    }

    // Security Check
    if (req.user?.role === Role.PATIENT) {
      const patientObj: any = appointment.patientId && typeof appointment.patientId === 'object' ? appointment.patientId : null;
      if (!patientObj || (patientObj.userId && patientObj.userId.toString() !== req.user.id)) {
        throw new ForbiddenError('You are not authorized to view this appointment.');
      }
    }

    res.status(200).json({
      status: 'success',
      data: { appointment: formatAppointment(appointment) },
    });
  } catch (err) {
    next(err);
  }
};

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = cancelAppointmentSchema.parse(req.body);

    const appointment = await Appointment.findById(id).populate('patientId');

    if (!appointment) {
      throw new NotFoundError('Appointment not found.');
    }

    const patientObj: any = appointment.patientId && typeof appointment.patientId === 'object' ? appointment.patientId : null;
    if (req.user?.role === Role.PATIENT && patientObj && patientObj.userId && patientObj.userId.toString() !== req.user.id) {
      throw new ForbiddenError('You are not authorized to cancel this appointment.');
    }

    const updated = await Appointment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'CANCELLED',
          notes: body.reason || 'Cancelled by user',
        },
      },
      { new: true }
    )
      .populate('patientId')
      .populate({ path: 'doctorId', populate: [{ path: 'userId' }] })
      .populate('branchId');

    await logAudit({
      branchId: appointment.branchId?.toString(),
      userId: req.user?.id,
      action: 'APPOINTMENT_CANCELLED',
      resource: 'appointments',
      details: `Cancelled appointment ${id} with reason: ${body.reason || 'None provided'}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully.',
      data: { appointment: formatAppointment(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const rescheduleAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = rescheduleAppointmentSchema.parse(req.body);

    const appointment = await Appointment.findById(id).populate('patientId');

    if (!appointment) {
      throw new NotFoundError('Appointment not found.');
    }

    const patientObj: any = appointment.patientId && typeof appointment.patientId === 'object' ? appointment.patientId : null;
    if (req.user?.role === Role.PATIENT && patientObj && patientObj.userId && patientObj.userId.toString() !== req.user.id) {
      throw new ForbiddenError('You are not authorized to reschedule this appointment.');
    }

    const apptDateObj = new Date(data.appointmentDate);
    const targetDateStr = apptDateObj.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    if (targetDateStr < todayStr) {
      throw new ValidationError('Cannot reschedule to a past date.');
    }

    // Availability check
    const availability = await calculateDoctorSlots(appointment.doctorId.toString(), targetDateStr);
    if (!availability.isWorkingDay || availability.isOnLeave || availability.isHoliday) {
      throw new ValidationError('Doctor is not available on the requested reschedule date.');
    }

    // Overlap check excluding current appointment
    const { startOfDay, endOfDay } = getUTCStartAndEndOfDay(targetDateStr);

    const doctorOverlap = await Appointment.findOne({
      _id: { $ne: id },
      doctorId: appointment.doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'CANCELLED' },
      startTime: data.slotStartTime,
      endTime: data.slotEndTime,
    });

    if (doctorOverlap) {
      throw new ValidationError('Target slot is already booked by another patient.');
    }

    const updated = await Appointment.findByIdAndUpdate(
      id,
      {
        $set: {
          appointmentDate: apptDateObj,
          startTime: data.slotStartTime,
          endTime: data.slotEndTime,
          status: 'SCHEDULED',
        },
      },
      { new: true }
    )
      .populate('patientId')
      .populate({ path: 'doctorId', populate: [{ path: 'userId' }] })
      .populate('branchId');

    await logAudit({
      branchId: appointment.branchId?.toString(),
      userId: req.user?.id,
      action: 'APPOINTMENT_RESCHEDULED',
      resource: 'appointments',
      details: `Rescheduled appointment ${id} to ${targetDateStr} ${data.slotStartTime}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Appointment rescheduled successfully.',
      data: { appointment: formatAppointment(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = updateAppointmentStatusSchema.parse(req.body);

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment not found.');
    }

    const updated = await Appointment.findByIdAndUpdate(id, { $set: { status: body.status } }, { new: true })
      .populate('patientId')
      .populate({ path: 'doctorId', populate: [{ path: 'userId' }] })
      .populate('branchId');

    res.status(200).json({
      status: 'success',
      message: `Appointment status updated to ${body.status}`,
      data: { appointment: formatAppointment(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const checkInAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      throw new NotFoundError('Appointment record not found.');
    }

    if (appointment.status === 'CHECKED_IN') {
      res.status(200).json({
        status: 'success',
        message: 'Patient is already checked in.',
        data: { appointment: formatAppointment(appointment) },
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCount = await Appointment.countDocuments({
      branchId: appointment.branchId,
      doctorId: appointment.doctorId,
      status: 'CHECKED_IN',
      createdAt: { $gte: today },
    });

    const tokenNumber = existingCount + 1;

    const updatedApp = await Appointment.findByIdAndUpdate(
      id,
      { $set: { status: 'CHECKED_IN', tokenNumber } },
      { new: true }
    )
      .populate('patientId')
      .populate({ path: 'doctorId', populate: [{ path: 'userId' }] })
      .populate('branchId');

    await logAudit({
      branchId: appointment.branchId?.toString(),
      userId: req.user?.id,
      action: 'PATIENT_CHECKED_IN',
      resource: 'appointments',
      details: `Checked in patient for Token #${tokenNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: `Patient checked in. Assigned Token #${tokenNumber}`,
      data: { appointment: formatAppointment(updatedApp) },
    });
  } catch (err) {
    next(err);
  }
};
