import { Request, Response, NextFunction } from 'express';
import { OpdQueue, Doctor, Patient, Appointment } from '../models';
import { NotFoundError } from '../utils/errors';
import { getIO } from '../socket';

export const getOpdQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, doctorId } = req.query;

    const filter: any = {};
    if (branchId) filter.branchId = branchId;
    if (doctorId) filter.doctorId = doctorId;

    const queue = await OpdQueue.find(filter)
      .sort({ tokenNumber: 1 })
      .populate('patientId', 'uhid firstName lastName gender dateOfBirth bloodGroup allergies chronicConditions')
      .populate('appointmentId', 'appointmentDate startTime endTime type status')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .lean();

    res.status(200).json({
      status: 'success',
      data: { queue },
    });
  } catch (err) {
    next(err);
  }
};

export const callNextPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { doctorId } = req.body;

    let targetDoctorId = doctorId;
    if (!targetDoctorId && req.user?.id) {
      const docProfile = await Doctor.findOne({ userId: req.user.id });
      if (docProfile) targetDoctorId = docProfile._id.toString();
    }

    if (!targetDoctorId) {
      res.status(400).json({ status: 'error', message: 'Doctor ID is required.' });
      return;
    }

    // Move currently engaged patient to completed if any
    await OpdQueue.updateMany(
      { doctorId: targetDoctorId, queueStatus: 'ENGAGED_WITH_DOCTOR' },
      { $set: { queueStatus: 'COMPLETED' } }
    );

    // Find next waiting patient
    const nextWaiting = await OpdQueue.findOne({ doctorId: targetDoctorId, queueStatus: 'WAITING' })
      .sort({ tokenNumber: 1 })
      .populate('patientId')
      .populate('appointmentId');

    if (!nextWaiting) {
      res.status(200).json({
        status: 'success',
        message: 'No waiting patients in queue.',
        data: { currentPatient: null },
      });
      return;
    }

    nextWaiting.queueStatus = 'ENGAGED_WITH_DOCTOR';
    await nextWaiting.save();

    const populatedNext: any = await OpdQueue.findById(nextWaiting._id)
      .populate('patientId')
      .populate('appointmentId')
      .lean();

    const patientName = populatedNext?.patientId
      ? `${populatedNext.patientId.firstName} ${populatedNext.patientId.lastName}`
      : 'Patient';

    // Broadcast Socket.IO update
    const io = getIO();
    io.emit('opd:queue-updated', { branchId: nextWaiting.branchId, doctorId: targetDoctorId });
    io.emit('opd:patient-called', {
      tokenNumber: nextWaiting.tokenNumber,
      patientName,
      doctorId: targetDoctorId,
      branchId: nextWaiting.branchId,
    });

    res.status(200).json({
      status: 'success',
      message: `Called Token #${nextWaiting.tokenNumber} - ${patientName}`,
      data: { currentPatient: populatedNext },
    });
  } catch (err) {
    next(err);
  }
};

export const skipQueueToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const item = await OpdQueue.findById(id);
    if (!item) {
      throw new NotFoundError('Queue token not found.');
    }

    item.queueStatus = 'PASSED';
    await item.save();

    const io = getIO();
    io.emit('opd:queue-updated', { branchId: item.branchId, doctorId: item.doctorId });

    res.status(200).json({
      status: 'success',
      message: `Token #${item.tokenNumber} skipped.`,
      data: { queueItem: item },
    });
  } catch (err) {
    next(err);
  }
};

export const updateQueueStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['WAITING', 'ENGAGED_WITH_DOCTOR', 'PASSED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ status: 'error', message: 'Invalid queue status.' });
      return;
    }

    const item = await OpdQueue.findByIdAndUpdate(id, { $set: { queueStatus: status } }, { new: true });
    if (!item) {
      throw new NotFoundError('Queue token not found.');
    }

    const io = getIO();
    io.emit('opd:queue-updated', { branchId: item.branchId, doctorId: item.doctorId });

    res.status(200).json({
      status: 'success',
      data: { queueItem: item },
    });
  } catch (err) {
    next(err);
  }
};
