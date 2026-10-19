import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  getBloodBankDashboard,
  getBloodUnits,
  createBloodUnit,
  updateBloodTest,
  reserveBloodUnit,
  issueBloodUnit,
  getBloodDonors,
  createBloodDonor,
} from '../controllers/bloodBank.controller';

const router = Router();

router.get(
  '/dashboard',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.LAB_TECHNICIAN,
    Role.BLOOD_BANK_STAFF
  ),
  getBloodBankDashboard
);

router.get(
  '/units',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.LAB_TECHNICIAN,
    Role.BLOOD_BANK_STAFF
  ),
  getBloodUnits
);

router.post(
  '/units',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.LAB_TECHNICIAN,
    Role.BLOOD_BANK_STAFF,
    Role.NURSE
  ),
  createBloodUnit
);

router.put(
  '/units/:id/test',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.LAB_TECHNICIAN,
    Role.BLOOD_BANK_STAFF
  ),
  updateBloodTest
);

router.post(
  '/units/:id/reserve',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.BLOOD_BANK_STAFF
  ),
  reserveBloodUnit
);

router.post(
  '/units/:id/issue',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.BLOOD_BANK_STAFF,
    Role.LAB_TECHNICIAN
  ),
  issueBloodUnit
);

router.get(
  '/donors',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.LAB_TECHNICIAN,
    Role.BLOOD_BANK_STAFF,
    Role.NURSE,
    Role.RECEPTIONIST
  ),
  getBloodDonors
);

router.post(
  '/donors',
  requireAuth,
  requireRole(
    Role.SUPER_ADMIN,
    Role.HOSPITAL_ADMIN,
    Role.BRANCH_ADMIN,
    Role.LAB_TECHNICIAN,
    Role.BLOOD_BANK_STAFF,
    Role.NURSE,
    Role.RECEPTIONIST
  ),
  createBloodDonor
);

export default router;

