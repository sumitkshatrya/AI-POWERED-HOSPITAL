import { z } from 'zod';

export const bloodGroupEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

export const componentTypeEnum = z.enum([
  'WHOLE_BLOOD',
  'PRBC',
  'PLATELETS',
  'FFP',
  'CRYOPRECIPITATE',
]);

export const bloodUnitStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'ISSUED',
  'EXPIRED',
  'DISCARDED',
]);

export const bloodTestingStatusEnum = z.enum(['PASSED', 'FAILED', 'PENDING']);

export const createBloodDonorSchema = z.object({
  name: z.string().min(2, 'Donor name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  age: z.number().int().min(17, 'Donor must be at least 17 years old').max(70),
  bloodGroup: bloodGroupEnum,
  contactPhone: z.string().min(5, 'Contact phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  medicalNotes: z.string().optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
});

export const createBloodUnitSchema = z.object({
  donorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
  bloodGroup: bloodGroupEnum,
  componentType: componentTypeEnum.default('WHOLE_BLOOD'),
  volumeMl: z.number().int().min(50).max(600).default(450),
  collectionDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime(),
  storageLocation: z.string().default('Blood Refrigerator 1, Shelf A'),
  storageTemperature: z.number().optional().default(4.0),
  testingStatus: bloodTestingStatusEnum.default('PASSED'),
  screeningNotes: z.string().optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
});

export const updateBloodTestSchema = z.object({
  testingStatus: bloodTestingStatusEnum,
  screeningNotes: z.string().min(2, 'Screening notes required'),
});

export const reserveBloodUnitSchema = z.object({
  patientId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  reason: z.string().optional(),
});

export const issueBloodUnitSchema = z.object({
  patientId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  crossmatchResult: z.enum(['COMPATIBLE', 'INCOMPATIBLE']),
  issueNotes: z.string().optional(),
});

