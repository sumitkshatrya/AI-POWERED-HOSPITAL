import { Router } from 'express';
import { Role } from '../types/roles';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatient,
  getPatientEMRTimeline,
} from '../controllers/patient.controller';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE),
  registerPatient
);

router.get(
  '/',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE, Role.PHARMACIST, Role.LAB_TECHNICIAN, Role.PATIENT),
  getPatients
);

router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.get('/:id/emr', getPatientEMRTimeline);
router.get('/:id/timeline', getPatientEMRTimeline);

export default router;
