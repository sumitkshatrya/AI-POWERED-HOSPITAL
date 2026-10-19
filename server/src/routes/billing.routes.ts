import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  payInvoice,
  streamInvoicePdf,
  getAccountantDashboard,
} from '../controllers/billing.controller';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT), getAccountantDashboard);
router.post('/invoices', createInvoice);
router.get('/invoices', getInvoices);
router.get('/invoices/:id/pdf', streamInvoicePdf);
router.get('/invoices/:id', getInvoiceById);
router.post('/invoices/:id/pay', payInvoice);

export default router;
