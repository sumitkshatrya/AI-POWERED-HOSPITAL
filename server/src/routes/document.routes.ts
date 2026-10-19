import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  uploadMiddleware,
  uploadDocument,
  downloadDocument,
  getPatientDocuments,
  deleteDocument,
} from '../controllers/document.controller';

const router = Router();

router.use(requireAuth);

router.post('/upload', uploadMiddleware, uploadDocument);
router.get('/:id/download', downloadDocument);
router.get('/patient/:patientId', getPatientDocuments);
router.delete('/:id', deleteDocument);

export default router;

