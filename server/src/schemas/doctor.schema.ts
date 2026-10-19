import { z } from 'zod';

export const updateDoctorProfileSchema = z.object({
  registrationNumber: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.number().optional(),
  languages: z.array(z.string()).or(z.string()).optional(),
  consultationFee: z.number().optional(),
  followupFee: z.number().optional(),
  bio: z.string().optional(),
  services: z.array(z.string()).or(z.string()).optional(),
  isOnlineAvailable: z.boolean().optional(),
  availabilityHours: z.any().optional(),
});

export const createDoctorReviewSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

