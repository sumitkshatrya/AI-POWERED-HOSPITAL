import { z } from 'zod';

export const createDepartmentSchema = z.object({
  hospitalId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  code: z.string().min(2, 'Department code is required').toUpperCase(),
  headDoctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional().nullable(),
  services: z.array(z.string()).optional().default([]),
  workingHours: z.string().optional().default('08:00 - 20:00'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

