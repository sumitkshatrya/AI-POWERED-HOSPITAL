import { z } from 'zod';

export const createHospitalSchema = z.object({
  name: z.string().min(2, 'Hospital name must be at least 2 characters'),
  code: z.string().min(2, 'Hospital code/registration number is required').toUpperCase(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  contactEmail: z.string().email('Invalid contact email'),
  contactPhone: z.string().min(5, 'Contact phone is required'),
  address: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  workingHours: z.string().optional().default('24/7 Emergency & OPD'),
  facilities: z.array(z.string()).optional(),
  taxId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional().default('ACTIVE'),
});

export const updateHospitalSchema = createHospitalSchema.partial();

