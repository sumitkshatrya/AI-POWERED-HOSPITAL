import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getAuditLogs } from '../controllers/auditLog.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getAuditLogs);

export default router;

