import { Router } from 'express';
import { Role } from '../types/roles';
import { requireAuth, requireRole, requireHospitalAccess, requireBranchAccess } from '../middleware/auth';
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from '../controllers/branch.controller';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN),
  requireHospitalAccess((req) => req.body.hospitalId),
  createBranch
);

router.get('/', getBranches);

router.get(
  '/:id',
  requireBranchAccess((req) => req.params.id as string),
  getBranchById
);

router.put(
  '/:id',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN),
  requireBranchAccess((req) => req.params.id as string),
  updateBranch
);

router.delete(
  '/:id',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN),
  deleteBranch
);

export default router;

