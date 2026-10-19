import { z } from 'zod';

export const createLabCatalogItemSchema = z.object({
  hospitalId: z.string().optional().nullable(),
  testCode: z.string().min(1, 'Test code is required'),
  testName: z.string().min(1, 'Test name is required'),
  category: z.enum(['HAEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'SEROLOGY', 'PATHOLOGY']).default('BIOCHEMISTRY'),
  specimenType: z.string().default('WHOLE_BLOOD'),
  containerType: z.string().default('EDTA_TUBE'),
  price: z.number().min(0).default(50.0),
  referenceRangeMin: z.number().optional().nullable(),
  referenceRangeMax: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const collectSampleSchema = z.object({
  sampleBarcode: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const enterLabResultsSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().min(1, 'Item ID is required'),
      resultValue: z.string().min(1, 'Result value is required'),
      unit: z.string().optional().nullable(),
      referenceRange: z.string().optional().nullable(),
      flag: z.enum(['NORMAL', 'HIGH', 'LOW', 'CRITICAL']).optional().default('NORMAL'),
      technicianNotes: z.string().optional().nullable(),
    })
  ).min(1, 'At least one test result must be entered'),
  remarks: z.string().optional().nullable(),
});

export const verifyLabOrderSchema = z.object({
  remarks: z.string().optional().nullable(),
});

export const createLabOrderSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  consultationId: z.string().optional().nullable(),
  doctorId: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  items: z.array(
    z.object({
      catalogId: z.string().optional().nullable(),
      testName: z.string().min(1, 'Test name is required'),
      testCode: z.string().optional().nullable(),
      specimenType: z.string().optional().nullable(),
      price: z.number().optional().default(0.0),
      instructions: z.string().optional().nullable(),
    })
  ).min(1, 'At least one lab item is required'),
});

export type CreateLabCatalogItemInput = z.infer<typeof createLabCatalogItemSchema>;
export type CollectSampleInput = z.infer<typeof collectSampleSchema>;
export type EnterLabResultsInput = z.infer<typeof enterLabResultsSchema>;
export type VerifyLabOrderInput = z.infer<typeof verifyLabOrderSchema>;
export type CreateLabOrderInput = z.infer<typeof createLabOrderSchema>;
