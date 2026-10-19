import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  getWards,
  createWard,
  getBedsMatrix,
  createBed,
  updateBedStatus,
} from '../controllers/bed.controller';

const router = Router();

router.use(requireAuth);

// Wards
router.get(
  '/wards',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST),
  getWards
);
router.post(
  '/wards',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN),
  createWard
);

// Beds Matrix
router.get(
  '/beds',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST),
  getBedsMatrix
);
router.post(
  '/beds',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN),
  createBed
);
router.put(
  '/beds/:id/status',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.NURSE),
  updateBedStatus
);

export default router;

