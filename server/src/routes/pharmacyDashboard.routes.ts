import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getPharmacyDashboardStats } from '../controllers/pharmacyDashboard.controller';

const router = Router();

router.use(requireAuth);

router.get('/stats', getPharmacyDashboardStats);

export default router;

