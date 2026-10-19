import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  getPharmacySales,
  createPharmacySale,
  fulfillPrescription,
} from '../controllers/pharmacySale.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getPharmacySales);
router.post(
  '/',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST),
  createPharmacySale
);
router.post(
  '/fulfill-prescription',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST),
  fulfillPrescription
);

export default router;

