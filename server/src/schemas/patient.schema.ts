import { z } from 'zod';

export const createPatientSchema = z.object({
  hospitalId: z.string().optional(),
  branchId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().or(z.date()),
  bloodGroup: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  allergies: z.array(z.string()).or(z.string()).optional(),
  chronicConditions: z.array(z.string()).or(z.string()).optional(),
  medicalHistory: z.array(z.string()).or(z.string()).optional(),
  existingConditions: z.array(z.string()).or(z.string()).optional(),
  previousSurgeries: z.array(z.string()).or(z.string()).optional(),
  currentMedication: z.array(z.string()).or(z.string()).optional(),
  familyHistory: z.array(z.string()).or(z.string()).optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
