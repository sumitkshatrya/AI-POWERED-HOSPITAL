import { z } from 'zod';

export const createRadiologyOrderSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  imagingType: z.enum(['XRAY', 'CT_SCAN', 'MRI', 'ULTRASOUND', 'MAMMOGRAM', 'PET_SCAN']).default('XRAY'),
  bodyPart: z.string().min(1, 'Body part is required').default('Chest'),
  clinicalHistory: z.string().optional().nullable(),
  urgency: z.enum(['ROUTINE', 'URGENT', 'STAT']).default('ROUTINE'),
  fee: z.number().optional().default(150.0),
});

export const scheduleRadiologyScanSchema = z.object({
  scheduledAt: z.string().or(z.date()),
});

export const completeRadiologyScanSchema = z.object({
  pacsViewerUrl: z.string().optional().nullable(),
  studyInstanceUid: z.string().optional().nullable(),
  accessionNumber: z.string().optional().nullable(),
  dicomSeriesCount: z.number().int().positive().optional().default(1),
});

export const draftRadiologyReportSchema = z.object({
  findings: z.string().min(1, 'Radiology findings are required'),
  impression: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
});

export const verifyRadiologyReportSchema = z.object({
  remarks: z.string().optional().nullable(),
});

export type CreateRadiologyOrderInput = z.infer<typeof createRadiologyOrderSchema>;
export type ScheduleRadiologyScanInput = z.infer<typeof scheduleRadiologyScanSchema>;
export type CompleteRadiologyScanInput = z.infer<typeof completeRadiologyScanSchema>;
export type DraftRadiologyReportInput = z.infer<typeof draftRadiologyReportSchema>;
export type VerifyRadiologyReportInput = z.infer<typeof verifyRadiologyReportSchema>;

