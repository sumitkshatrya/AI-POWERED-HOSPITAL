import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '../types/roles';
import {
  admitPatient,
  getAdmissions,
  getAdmissionById,
  transferBed,
  createDoctorRound,
  getDoctorRounds,
  createNursingNote,
  getNursingNotes,
  createIpdMedicationMAR,
  getMarSchedules,
  updateMARStatus,
} from '../controllers/ipd.controller';

const router = Router();

router.use(requireAuth);

// Admissions
router.post(
  '/admissions',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.RECEPTIONIST),
  admitPatient
);

router.get(
  '/admissions',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.PATIENT),
  getAdmissions
);

router.get(
  '/admissions/:id',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.PATIENT),
  getAdmissionById
);

router.put(
  '/admissions/:id/transfer-bed',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE),
  transferBed
);

router.post(
  '/admissions/:id/transfer',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE),
  transferBed
);

// Doctor Rounds
router.get(
  '/admissions/:id/rounds',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE),
  getDoctorRounds
);

router.post(
  '/admissions/:id/rounds',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR),
  createDoctorRound
);

// Nursing Notes
router.get(
  '/admissions/:id/nursing-notes',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.NURSE, Role.DOCTOR),
  getNursingNotes
);

router.post(
  '/admissions/:id/nursing-notes',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.NURSE),
  createNursingNote
);

// MAR (Medication Administration Record)
router.get(
  '/mar',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.PHARMACIST),
  getMarSchedules
);

router.post(
  '/admissions/:id/mar',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE),
  createIpdMedicationMAR
);

router.put(
  '/mar/:id/status',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.NURSE),
  updateMARStatus
);

export default router;

