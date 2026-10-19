import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getPrescriptionById } from '../controllers/prescription.controller';
import { getPrescriptionPdf } from '../controllers/prescriptionPdf.controller';

const router = Router();

router.use(requireAuth);

router.get('/:id/pdf', getPrescriptionPdf);
router.get('/:id', getPrescriptionById);

export default router;
