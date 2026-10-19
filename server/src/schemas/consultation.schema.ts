import { z } from 'zod';

export const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  durationDays: z.number().min(1, 'Duration days must be at least 1'),
  route: z.enum(['ORAL', 'IV', 'TOPICAL', 'INHALATION', 'SUBLINGUAL']).default('ORAL'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  instructions: z.string().optional().nullable(),
});

export const labOrderItemInputSchema = z.object({
  testName: z.string().min(1, 'Test name is required'),
  testCode: z.string().optional().nullable(),
  specimenType: z.string().optional().nullable(),
  price: z.number().optional().default(50),
});

export const createConsultationSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  chiefComplaints: z.string().min(1, 'Chief complaints are required'),
  symptoms: z.array(z.string()).optional().default([]),
  clinicalFindings: z.string().optional().nullable(),
  examinationNotes: z.string().optional().nullable(),
  assessment: z.string().optional().nullable(),
  treatmentPlan: z.string().optional().nullable(),
  followupDate: z.string().optional().nullable(),
  isDraft: z.boolean().optional().default(false),
  status: z.enum(['DRAFT', 'FINAL']).optional().default('FINAL'),
  vitals: z.object({
    systolicBp: z.number().optional(),
    diastolicBp: z.number().optional(),
    pulseRate: z.number().optional(),
    temperature: z.number().optional(),
    spo2: z.number().optional(),
    weightKg: z.number().optional(),
    heightCm: z.number().optional(),
    bmi: z.number().optional(),
  }).optional().default({}),
  diagnosisCodes: z.array(
    z.object({
      code: z.string(),
      description: z.string(),
      type: z.enum(['PRIMARY', 'SECONDARY']).default('PRIMARY'),
    })
  ).optional().default([]),
  soapNotes: z.object({
    subjective: z.string().optional(),
    objective: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
  }).optional().default({}),
  prescription: z.object({
    adviceInstructions: z.string().optional().nullable(),
    items: z.array(prescriptionItemSchema).optional().default([]),
  }).optional(),
  labOrders: z.array(labOrderItemInputSchema).optional().default([]),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
