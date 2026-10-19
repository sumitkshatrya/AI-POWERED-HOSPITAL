import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  getDoctorDashboard,
  updateDoctorProfile,
  addDoctorReview,
  getDoctorSchedule,
  updateDoctorSchedule,
} from '../controllers/doctor.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';

const router = Router();

// Public Doctor Search Directory
router.get('/', getDoctors);

// Protected Doctor Dashboard (Must be before /:id)
router.get('/me/dashboard', requireAuth, requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR), getDoctorDashboard);

// Doctor Schedule Configuration Endpoints (Must be before /:id)
router.get('/:id/schedule', requireAuth, getDoctorSchedule);
router.put('/:id/schedule', requireAuth, requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR), updateDoctorSchedule);

// Public Doctor Profile Page
router.get('/:id', getDoctorById);

// Protected Doctor Profile Update
router.put('/:id', requireAuth, updateDoctorProfile);

// Protected Patient Review
router.post('/:id/reviews', requireAuth, addDoctorReview);

export default router;

