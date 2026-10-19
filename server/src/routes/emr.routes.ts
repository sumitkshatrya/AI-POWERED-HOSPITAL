import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getEmrTimeline,
  recordRadiologyReport,
  recordProcedure,
  recordAdmission,
} from '../controllers/emr.controller';

const router = Router();

router.use(requireAuth);

router.get('/patients/:patientId/emr-timeline', getEmrTimeline);
router.post('/patients/:patientId/radiology', recordRadiologyReport);
router.post('/radiology', recordRadiologyReport);
router.post('/patients/:patientId/procedures', recordProcedure);
router.post('/procedures', recordProcedure);
router.post('/patients/:patientId/admissions', recordAdmission);
router.post('/admissions', recordAdmission);

export default router;

