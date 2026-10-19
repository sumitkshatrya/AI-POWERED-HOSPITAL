import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  finalizeDischarge,
  getDischargePdf,
} from '../controllers/discharge.controller';

const router = Router();

router.use(requireAuth);

router.post(
  '/admissions/:id/discharge',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR),
  finalizeDischarge
);

router.get(
  '/admissions/:id/discharge-pdf',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.PATIENT),
  getDischargePdf
);

router.get(
  '/admissions/:id/discharge/pdf',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.PATIENT),
  getDischargePdf
);

export default router;

