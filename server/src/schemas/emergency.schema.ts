import { z } from 'zod';

export const emergencyTypeEnum = z.enum([
  'TRAUMA',
  'CARDIAC',
  'RESPIRATORY',
  'STROKE',
  'BURNS',
  'POISONING',
  'PEDIATRIC',
  'GENERAL',
]);

export const triageLevelEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const emergencyStatusEnum = z.enum([
  'ACTIVE',
  'WAITING',
  'CRITICAL',
  'STABILIZED',
  'ADMITTED',
  'DISCHARGED',
]);

export const createEmergencyVisitSchema = z.object({
  patientId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
  unknownPatientName: z.string().optional(),
  gender: z.string().optional(),
  ageEstimate: z.number().int().min(0).max(130).optional(),
  arrivalTime: z.string().datetime().optional(),
  emergencyType: emergencyTypeEnum.default('GENERAL'),
  chiefComplaint: z.string().min(2, 'Chief complaint is required'),
  initialVitals: z
    .object({
      heartRate: z.number().optional(),
      systolicBp: z.number().optional(),
      diastolicBp: z.number().optional(),
      spo2: z.number().optional(),
      respiratoryRate: z.number().optional(),
      temperature: z.number().optional(),
      gcsScore: z.number().min(3).max(15).optional(),
    })
    .optional(),
  triageLevel: triageLevelEnum.default('MEDIUM'),
  triageNotes: z.string().optional(),
  assignedDoctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
});

export const updateTriageSchema = z.object({
  triageLevel: triageLevelEnum,
  triageNotes: z.string().optional(),
  clinicalVerification: z.boolean().default(true),
});

export const updateEmergencyStatusSchema = z.object({
  status: emergencyStatusEnum,
  dischargeNotes: z.string().optional(),
  assignedDoctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
  admissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
});

