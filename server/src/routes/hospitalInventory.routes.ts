import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  consumeInventoryItem,
} from '../controllers/hospitalInventory.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getInventoryItems);
router.get('/:id', getInventoryItemById);
router.post(
  '/',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.NURSE),
  createInventoryItem
);
router.put(
  '/:id',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.NURSE),
  updateInventoryItem
);
router.post(
  '/:id/consume',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.DOCTOR, Role.NURSE),
  consumeInventoryItem
);

export default router;

