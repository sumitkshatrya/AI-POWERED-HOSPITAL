import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  createLabOrder,
  getLabOrders,
  getLabOrderById,
  collectSample,
  enterLabResults,
  verifyLabOrder,
  generateLabOrderPdf,
} from '../controllers/lab.controller';

const router = Router();

router.use(requireAuth);

router.get('/orders', getLabOrders);
router.post(
  '/orders',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN),
  createLabOrder
);
router.get('/orders/:id', getLabOrderById);
router.get('/orders/:id/pdf', generateLabOrderPdf);

router.post(
  '/orders/:id/collect-sample',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.NURSE, Role.LAB_TECHNICIAN, Role.DOCTOR),
  collectSample
);

router.post(
  '/orders/:id/results',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.LAB_TECHNICIAN, Role.DOCTOR),
  enterLabResults
);

router.post(
  '/orders/:id/verify',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.LAB_TECHNICIAN, Role.DOCTOR),
  verifyLabOrder
);

export default router;
