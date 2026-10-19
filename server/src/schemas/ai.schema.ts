import { z } from 'zod';

export const clinicalNoteInputSchema = z.object({
  rawNotes: z.string().min(3, 'Clinical notes must be at least 3 characters long'),
});

export const reportExplanationSchema = z.object({
  reportId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format").optional(),
  reportTitle: z.string().min(1, 'Report title is required'),
  reportCategory: z.enum(['LABORATORY', 'RADIOLOGY']),
  findings: z.string().min(1, 'Findings are required'),
  impression: z.string().optional(),
});

export const specialtyNavigationSchema = z.object({
  symptomQuery: z.string().min(2, 'Symptom query must be at least 2 characters long'),
});

export const adminAnalyticsSchema = z.object({
  timeframeLabel: z.string().optional().default('This Month'),
});

export const chatAssistantSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system', 'model']),
      content: z.string(),
    })
  ).optional(),
  context: z.object({
    hospitalName: z.string().optional(),
    branchName: z.string().optional(),
    currentPage: z.string().optional(),
  }).optional(),
});

