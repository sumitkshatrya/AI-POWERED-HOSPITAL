import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import {
  getPatientSummary,
  structureClinicalNotes,
  explainReport,
  navigateSpecialty,
  getAdminAnalytics,
  getAiLogs,
  chatAssistant,
} from '../controllers/ai.controller';

const router = Router();

// AI Chat Assistant (accessible with optionalAuth for authenticated users or visitors)
router.post('/chat', optionalAuth, chatAssistant);
router.post('/assistant/chat', optionalAuth, chatAssistant);

// Protect sensitive clinical AI endpoints
router.use(requireAuth);

// Patient Summary
router.get('/patients/:patientId/summary', getPatientSummary);

// Clinical Note Assistant (SOAP Structurer)
router.post('/clinical-notes/structure', structureClinicalNotes);

// Medical Report Plain-Language Explainer
router.post('/reports/explain', explainReport);

// Smart Specialty & Symptom Navigator
router.post('/specialty-navigation', navigateSpecialty);

// Admin Operational Analytics & Intelligence
router.get('/admin-analytics', getAdminAnalytics);

// Security Audit Logs
router.get('/logs', getAiLogs);

export default router;
