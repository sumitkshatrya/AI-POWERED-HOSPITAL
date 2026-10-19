import { z } from 'zod';

export const appointmentTypeEnum = z.enum(['OPD', 'FOLLOW_UP', 'VIDEO', 'EMERGENCY', 'OPD_CONSULTATION', 'OPD_FIRST']);
export const appointmentStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'WAITING',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'SCHEDULED'
]);

export const createAppointmentSchema = z.object({
  hospitalId: z.string().optional().nullable(),
  branchId: z.string().min(1, 'Branch ID is required'),
  departmentId: z.string().optional().nullable(),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  appointmentDate: z.string().or(z.date()),
  slotStartTime: z.string().min(1, 'Slot start time is required'),
  slotEndTime: z.string().min(1, 'Slot end time is required'),
  appointmentType: appointmentTypeEnum.default('OPD'),
  reasonForVisit: z.string().optional().nullable(),
  fee: z.number().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().or(z.date()),
  slotStartTime: z.string().min(1, 'New slot start time is required'),
  slotEndTime: z.string().min(1, 'New slot end time is required'),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().optional().nullable(),
});

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusEnum,
});

export const doctorScheduleSchema = z.object({
  workingDays: z.array(z.string()).default(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']),
  startTime: z.string().default('09:00'),
  endTime: z.string().default('17:00'),
  breakStartTime: z.string().optional().nullable().default('13:00'),
  breakEndTime: z.string().optional().nullable().default('14:00'),
  slotDurationMinutes: z.number().int().positive().default(30),
  maxAppointmentsPerDay: z.number().int().positive().default(20),
  leaves: z.array(z.object({
    id: z.string().optional(),
    fromDate: z.string(),
    toDate: z.string(),
    reason: z.string().optional(),
  })).optional().default([]),
  holidays: z.array(z.string()).optional().default([]),
  allowOnline: z.boolean().optional().default(true),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type DoctorScheduleInput = z.infer<typeof doctorScheduleSchema>;
