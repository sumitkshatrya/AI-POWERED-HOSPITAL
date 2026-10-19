import { z } from 'zod';

export const createInsurancePolicySchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  provider: z.string().min(1, 'Insurance provider is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  policyHolderName: z.string().min(1, 'Policy holder name is required'),
  coverageAmount: z.number().positive('Coverage amount must be greater than zero'),
  validFrom: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  validTo: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  copayPercentage: z.number().min(0).max(100).optional().default(0),
  deductible: z.number().min(0).optional().default(0),
  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED']).default('ACTIVE'),
  notes: z.string().optional(),
});

export const createInsuranceClaimSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  insuranceId: z.string().min(1, 'Insurance policy ID is required'),
  invoiceId: z.string().optional().nullable(),
  treatmentDescription: z.string().min(1, 'Treatment description is required'),
  diagnosis: z.string().optional(),
  claimedAmount: z.number().positive('Claimed amount must be positive'),
  documents: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        type: z.string().optional(),
        uploadedAt: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  status: z.enum(['DRAFT', 'SUBMITTED']).default('SUBMITTED'),
});

export const adjudicateClaimSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED']),
  approvedAmount: z.number().min(0).optional(),
  settledAmount: z.number().min(0).optional(),
  adjudicationNotes: z.string().optional(),
  denialReason: z.string().optional(),
});

export type CreateInsurancePolicyInput = z.infer<typeof createInsurancePolicySchema>;
export type CreateInsuranceClaimInput = z.infer<typeof createInsuranceClaimSchema>;
export type AdjudicateClaimInput = z.infer<typeof adjudicateClaimSchema>;

