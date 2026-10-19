import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  createRadiologyOrder,
  scheduleRadiologyScan,
  completeRadiologyScan,
  draftRadiologyReport,
  verifyRadiologyReport,
  getRadiologyWorklist,
  getRadiologyOrderById,
} from '../controllers/radiology.controller';

const router = Router();

router.use(requireAuth);

router.get('/worklist', getRadiologyWorklist);
router.get('/orders/:id', getRadiologyOrderById);

router.post(
  '/orders',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST),
  createRadiologyOrder
);

router.post(
  '/orders/:id/schedule',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RADIOLOGIST, Role.RECEPTIONIST),
  scheduleRadiologyScan
);

router.post(
  '/orders/:id/complete-scan',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RADIOLOGIST),
  completeRadiologyScan
);

router.post(
  '/orders/:id/report',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RADIOLOGIST, Role.DOCTOR),
  draftRadiologyReport
);

router.post(
  '/orders/:id/verify',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RADIOLOGIST, Role.DOCTOR),
  verifyRadiologyReport
);

export default router;

