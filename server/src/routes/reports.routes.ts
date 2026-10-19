import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generateReport } from '../controllers/reports.controller';

const router = Router();

router.use(requireAuth);

router.get('/', generateReport);

export default router;

