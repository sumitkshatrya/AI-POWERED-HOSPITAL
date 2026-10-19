import { z } from 'zod';

export const createVitalsSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional().nullable(),
  systolicBp: z.number().int().optional().nullable(),
  diastolicBp: z.number().int().optional().nullable(),
  bpSystolic: z.number().int().optional().nullable(),
  bpDiastolic: z.number().int().optional().nullable(),
  pulseRate: z.number().int().optional().nullable(),
  heartRate: z.number().int().optional().nullable(),
  temperature: z.number().optional().nullable(),
  spo2: z.number().optional().nullable(),
  spO2: z.number().optional().nullable(),
  respiratoryRate: z.number().int().optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  bloodGlucose: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateVitalsInput = z.infer<typeof createVitalsSchema>;
