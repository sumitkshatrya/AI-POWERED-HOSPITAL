import { z } from 'zod';

export const createBranchSchema = z.object({
  hospitalId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  code: z.string().min(2, 'Branch code is required').toUpperCase(),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(2, 'Postal code is required'),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email('Invalid contact email').optional().nullable(),
  workingHours: z.string().optional().default('24/7'),
  timeZone: z.string().optional().default('UTC'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional().default('ACTIVE'),
});

export const updateBranchSchema = createBranchSchema.partial();

