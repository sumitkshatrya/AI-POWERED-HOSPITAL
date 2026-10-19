import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  getEmergencyVisits,
  getEmergencyDashboard,
  createEmergencyVisit,
  updateTriage,
  updateEmergencyStatus,
} from '../controllers/emergency.controller';

const router = Router();

router.get(
  '/visits',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.RECEPTIONIST
  ),
  getEmergencyVisits
);

router.get(
  '/dashboard',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.RECEPTIONIST
  ),
  getEmergencyDashboard
);

router.post(
  '/visits',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.RECEPTIONIST
  ),
  createEmergencyVisit
);

router.put(
  '/visits/:id/triage',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.DOCTOR,
    Role.NURSE
  ),
  updateTriage
);

router.put(
  '/visits/:id/status',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.RECEPTIONIST
  ),
  updateEmergencyStatus
);

export default router;

