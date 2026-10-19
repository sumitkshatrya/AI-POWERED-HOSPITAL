import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createAppointment,
  getAppointments,
  getAvailableSlots,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
  checkInAppointment,
} from '../controllers/appointment.controller';

const router = Router();

router.use(requireAuth);

router.get('/available-slots', getAvailableSlots);
router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.patch('/:id/status', updateAppointmentStatus);
router.post('/:id/cancel', cancelAppointment);
router.post('/:id/reschedule', rescheduleAppointment);
router.post('/:id/check-in', checkInAppointment);

export default router;
