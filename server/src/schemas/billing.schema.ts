import { z } from 'zod';

export const serviceCategoryEnum = z.enum([
  'CONSULTATION',
  'ROOM',
  'BED',
  'ICU',
  'PHARMACY',
  'LABORATORY',
  'RADIOLOGY',
  'PROCEDURES',
  'SURGERY',
  'EMERGENCY',
  'OTHER',
  // Backward compatibility:
  'LAB_TEST',
  'MEDICINE',
]);

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  consultationId: z.string().optional().nullable(),
  emergencyVisitId: z.string().optional().nullable(),
  admissionId: z.string().optional().nullable(),
  hospitalId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  tax: z.number().nonnegative().optional().default(0),
  discount: z.number().nonnegative().optional().default(0),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Item description is required'),
        itemType: serviceCategoryEnum.default('OTHER'),
        quantity: z.number().int().positive().default(1),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1, 'At least one invoice item is required'),
});

export const payInvoiceSchema = z.object({
  paymentMethod: z
    .enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'UPI', 'ONLINE', 'RAZORPAY', 'STRIPE'])
    .default('CASH'),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>;
