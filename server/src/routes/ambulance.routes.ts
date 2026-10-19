import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  getAmbulances,
  createAmbulance,
  updateAmbulanceStatus,
  getDispatches,
  createDispatch,
  updateDispatchStatus,
} from '../controllers/ambulance.controller';

const router = Router();

router.get(
  '/vehicles',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.RECEPTIONIST,
    Role.NURSE,
    Role.DOCTOR,
    Role.AMBULANCE_OPERATOR
  ),
  getAmbulances
);

router.post(
  '/vehicles',
  requireAuth,
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN),
  createAmbulance
);

router.put(
  '/vehicles/:id/status',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.AMBULANCE_OPERATOR,
    Role.NURSE,
    Role.RECEPTIONIST
  ),
  updateAmbulanceStatus
);

router.get(
  '/dispatches',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.RECEPTIONIST,
    Role.NURSE,
    Role.DOCTOR,
    Role.AMBULANCE_OPERATOR
  ),
  getDispatches
);

router.post(
  '/dispatches',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.RECEPTIONIST,
    Role.NURSE,
    Role.DOCTOR,
    Role.AMBULANCE_OPERATOR
  ),
  createDispatch
);

router.put(
  '/dispatches/:id/status',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.AMBULANCE_OPERATOR,
    Role.NURSE,
    Role.DOCTOR,
    Role.RECEPTIONIST
  ),
  updateDispatchStatus
);

export default router;

