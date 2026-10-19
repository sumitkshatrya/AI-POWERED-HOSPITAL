import { z } from 'zod';

export const ambulanceTypeEnum = z.enum([
  'BLS',
  'ALS',
  'PATIENT_TRANSPORT',
  'MOBILE_ICU',
]);

export const ambulanceStatusEnum = z.enum([
  'AVAILABLE',
  'ASSIGNED',
  'EN_ROUTE',
  'AT_LOCATION',
  'TRANSPORTING',
  'COMPLETED',
  'MAINTENANCE',
]);

export const dispatchStatusEnum = z.enum([
  'ASSIGNED',
  'EN_ROUTE',
  'AT_LOCATION',
  'TRANSPORTING',
  'COMPLETED',
  'CANCELLED',
]);

export const dispatchPriorityEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const createAmbulanceSchema = z.object({
  vehicleNumber: z.string().min(2, 'Vehicle number/plate is required'),
  model: z.string().optional(),
  ambulanceType: ambulanceTypeEnum.default('ALS'),
  driverName: z.string().min(2, 'Driver name is required'),
  driverPhone: z.string().min(5, 'Driver phone is required'),
  currentLocation: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
});

export const updateAmbulanceStatusSchema = z.object({
  status: ambulanceStatusEnum,
  currentLocation: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
});

export const createDispatchSchema = z.object({
  ambulanceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
  callerName: z.string().min(2, 'Caller name is required'),
  callerPhone: z.string().min(5, 'Caller contact phone is required'),
  pickupLocation: z.string().min(3, 'Pickup location is required'),
  destinationLocation: z.string().default('Emergency Department'),
  emergencyDescription: z.string().min(2, 'Emergency description is required'),
  priority: dispatchPriorityEnum.default('HIGH'),
  patientId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
});

export const updateDispatchStatusSchema = z.object({
  status: dispatchStatusEnum,
  paramedicNotes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

