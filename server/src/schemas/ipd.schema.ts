import { z } from 'zod';

export const createWardSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Ward name must be at least 2 characters'),
    code: z.string().min(2, 'Ward code is required'),
    category: z.enum(['GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'NICU', 'EMERGENCY']).default('GENERAL'),
    floor: z.string().optional().default('1st Floor'),
    totalBeds: z.number().int().positive().optional().default(10),
    dailyRate: z.number().nonnegative().optional().default(100),
    description: z.string().optional(),
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
  }),
});

export const createBedSchema = z.object({
  body: z.object({
    wardId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
    bedNumber: z.string().min(1, 'Bed number is required'),
    roomNumber: z.string().optional().default('101'),
    category: z.enum(['GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'NICU', 'EMERGENCY']).default('GENERAL'),
    dailyRate: z.number().nonnegative().optional().default(100),
    features: z.array(z.string()).optional().default([]),
  }),
});

export const updateBedStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
  body: z.object({
    status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE']),
  }),
});

export const createAdmissionSchema = z.object({
  body: z.object({
    patientId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
    doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
    attendingDoctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
    wardId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
    bedId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
    admissionReason: z.string().min(3, 'Admission reason is required'),
    initialDiagnosis: z.string().optional(),
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
  }),
});

export const transferBedSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
  body: z.object({
    targetBedId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
    transferReason: z.string().optional(),
  }),
});

export const createDoctorRoundSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
  body: z.object({
    clinicalProgressNotes: z.string().min(3, 'Clinical progress notes are required'),
    vitalsSummary: z.string().optional(),
    treatmentOrders: z.string().optional(),
    investigationOrders: z.string().optional(),
    dietInstructions: z.string().optional(),
    roundFee: z.number().nonnegative().optional().default(50),
  }),
});

export const createNursingNoteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
  body: z.object({
    shift: z.enum(['MORNING', 'EVENING', 'NIGHT']).default('MORNING'),
    noteText: z.string().min(3, 'Nursing note text is required'),
    carePlan: z.string().optional(),
    vitalsNote: z.string().optional(),
    patientMood: z.enum(['STABLE', 'RESTLESS', 'CRITICAL', 'PAIN']).default('STABLE'),
  }),
});

export const createIpdMedicationMARSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
  body: z.object({
    medicineName: z.string().min(1, 'Medicine name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    route: z.enum(['ORAL', 'IV', 'IM', 'SC', 'INHALATION', 'TOPICAL']).default('ORAL'),
    frequency: z.enum(['OD', 'BID', 'TID', 'QID', 'PRN', 'STAT']).default('BID'),
    scheduledTime: z.string().datetime().optional(),
  }),
});

export const updateMARStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
  body: z.object({
    status: z.enum(['SCHEDULED', 'GIVEN', 'MISSED', 'CANCELLED']),
    notes: z.string().optional(),
  }),
});

export const createIcuTelemetrySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
  body: z.object({
    heartRate: z.number().int().optional(),
    systolicBp: z.number().int().optional(),
    diastolicBp: z.number().int().optional(),
    spo2: z.number().int().optional(),
    respiratoryRate: z.number().int().optional(),
    temperature: z.number().optional(),
    ventilatorMode: z.string().optional(),
    fio2: z.number().optional(),
    peep: z.number().optional(),
    gcsScore: z.number().int().min(3).max(15).optional(),
    alertLevel: z.enum(['NORMAL', 'WARNING', 'CRITICAL']).optional(),
    telemetryNotes: z.string().optional(),
  }),
});

export const createDischargeSummarySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
  body: z.object({
    finalDiagnosis: z.string().min(3, 'Final diagnosis is required'),
    treatmentSummary: z.string().min(3, 'Treatment summary is required'),
    proceduresPerformed: z.string().optional(),
    dischargeCondition: z.enum(['RECOVERED', 'IMPROVED', 'STABLE', 'TRANSFERRED', 'LAMA', 'DECEASED']).default('RECOVERED'),
    dischargeMedications: z.array(
      z.object({
        medicineName: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        instructions: z.string().optional(),
      })
    ).optional().default([]),
    dietInstructions: z.string().optional(),
    activityInstructions: z.string().optional(),
    urgentWarningSigns: z.string().optional(),
    followupDate: z.string().optional(),
    followupInstructions: z.string().optional(),
  }),
});

