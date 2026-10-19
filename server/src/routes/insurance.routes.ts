import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  createInsurancePolicy,
  getInsurancePolicies,
  createInsuranceClaim,
  getInsuranceClaims,
  getInsuranceClaimById,
  adjudicateClaim,
  getInsuranceDashboardSummary,
} from '../controllers/insurance.controller';

const router = Router();

router.use(requireAuth);

router.get(
  '/dashboard',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT),
  getInsuranceDashboardSummary
);

router.get('/policies', getInsurancePolicies);
router.post(
  '/policies',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT, Role.RECEPTIONIST),
  createInsurancePolicy
);

router.get('/claims', getInsuranceClaims);
router.post('/claims', createInsuranceClaim);
router.get('/claims/:id', getInsuranceClaimById);
router.put(
  '/claims/:id/status',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT),
  adjudicateClaim
);

export default router;
