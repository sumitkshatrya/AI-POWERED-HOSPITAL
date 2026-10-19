import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  adjustStock,
} from '../controllers/medicine.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getMedicines);
router.get('/:id', getMedicineById);
router.post(
  '/',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST),
  createMedicine
);
router.put(
  '/:id',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST),
  updateMedicine
);
router.post(
  '/:id/adjust-stock',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST),
  adjustStock
);

export default router;

