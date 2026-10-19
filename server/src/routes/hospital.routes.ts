import { Router } from 'express';
import { Role } from '../types/roles';
import { requireAuth, requireRole, requireHospitalAccess } from '../middleware/auth';
import {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
} from '../controllers/hospital.controller';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole(Role.SUPER_ADMIN), createHospital);
router.get('/', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN), getHospitals);
router.get('/:id', requireHospitalAccess((req) => req.params.id as string), getHospitalById);
router.put('/:id', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN), requireHospitalAccess((req) => req.params.id as string), updateHospital);
router.delete('/:id', requireRole(Role.SUPER_ADMIN), deleteHospital);

export default router;

