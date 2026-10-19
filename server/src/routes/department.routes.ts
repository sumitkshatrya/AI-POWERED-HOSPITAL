import { Router } from 'express';
import { Role } from '../types/roles';
import { requireAuth, requireRole, requireHospitalAccess, requireBranchAccess } from '../middleware/auth';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  seedDefaultDepartments,
} from '../controllers/department.controller';

const router = Router();

router.use(requireAuth);

router.post('/seed-defaults', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN), seedDefaultDepartments);
router.post('/', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN), createDepartment);
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.put('/:id', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN), updateDepartment);
router.delete('/:id', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN), deleteDepartment);

export default router;

