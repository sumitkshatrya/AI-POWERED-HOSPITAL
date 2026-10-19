import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import { createConsultation, getConsultationById } from '../controllers/consultation.controller';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole(Role.DOCTOR, Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN), createConsultation);
router.get('/:id', getConsultationById);

export default router;

