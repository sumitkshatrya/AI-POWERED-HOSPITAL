import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  initiatePayment,
  verifyPayment,
  recordManualPayment,
  refundPayment,
  getPaymentTransactions,
} from '../controllers/payment.controller';

const router = Router();

router.use(requireAuth);

router.post('/initiate', initiatePayment);
router.post('/verify', verifyPayment);
router.post(
  '/manual',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT, Role.RECEPTIONIST),
  recordManualPayment
);
router.post(
  '/:id/refund',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT),
  refundPayment
);
router.get(
  '/transactions',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT),
  getPaymentTransactions
);

export default router;
