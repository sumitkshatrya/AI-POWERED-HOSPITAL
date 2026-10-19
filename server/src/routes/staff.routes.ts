import { Router } from 'express';
import { Role } from '../types/roles';
import { requireAuth, requireRole, requireHospitalAccess } from '../middleware/auth';
import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
} from '../controllers/staff.controller';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN), createStaff);
router.get('/', getStaff);
router.get('/:id', getStaffById);
router.put('/:id', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN), updateStaff);
router.patch('/:id/status', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN), toggleStaffStatus);
router.delete('/:id', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN), deleteStaff);

export default router;

