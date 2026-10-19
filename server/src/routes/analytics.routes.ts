import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getAdminAnalytics, getRoleDashboard } from '../controllers/analytics.controller';

const router = Router();

router.use(requireAuth);

router.get('/admin', getAdminAnalytics);
router.get('/dashboard', getRoleDashboard);

export default router;

