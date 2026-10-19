import { z } from 'zod';
import { Role } from '../types/roles';

export const createStaffSchema = z.object({
  hospitalId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional().nullable(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional().nullable(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional().nullable(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional().nullable(),
  role: z.nativeEnum(Role),
  joiningDate: z.string().optional().nullable(),
  profileImage: z.string().url('Invalid profile image URL').optional().nullable(),
  specialization: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional().default('ACTIVE'),
});

export const updateStaffSchema = createStaffSchema.partial();

