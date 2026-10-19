import { Router } from 'express';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import { getOpdQueue, callNextPatient, updateQueueStatus, skipQueueToken } from '../controllers/opdQueue.controller';

const router = Router();

// Publicly viewable for waiting room displays with optional tenant/doctor context
router.get('/', optionalAuth, getOpdQueue);

// Protected routes for clinical and administrative queue actions
router.use(requireAuth);
router.post('/call-next', requireRole(Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.SUPER_ADMIN), callNextPatient);
router.patch('/:id/status', updateQueueStatus);
router.post('/:id/skip', skipQueueToken);

export default router;
