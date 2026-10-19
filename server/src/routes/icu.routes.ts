import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  getIcuDashboard,
  recordIcuTelemetry,
} from '../controllers/icu.controller';

const router = Router();

router.use(requireAuth);

router.get(
  '/dashboard',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE),
  getIcuDashboard
);

router.post(
  '/admissions/:id/telemetry',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE),
  recordIcuTelemetry
);

export default router;

