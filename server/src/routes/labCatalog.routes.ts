import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  getLabCatalog,
  createLabCatalogItem,
  updateLabCatalogItem,
} from '../controllers/labCatalog.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getLabCatalog);
router.post(
  '/',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.LAB_TECHNICIAN, Role.DOCTOR),
  createLabCatalogItem
);
router.put(
  '/:id',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.LAB_TECHNICIAN, Role.DOCTOR),
  updateLabCatalogItem
);

export default router;
