import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { recordVitals, getPatientVitalsHistory } from '../controllers/vitals.controller';

const router = Router();

router.use(requireAuth);

router.post('/', recordVitals);
router.post('/patients/:patientId/vitals', recordVitals);
router.get('/patients/:patientId/vitals', getPatientVitalsHistory);

export default router;

