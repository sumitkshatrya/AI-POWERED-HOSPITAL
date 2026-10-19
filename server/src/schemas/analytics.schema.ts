import { z } from 'zod';

export const timeframeSchema = z.enum([
  'TODAY',
  '7_DAYS',
  '30_DAYS',
  '3_MONTHS',
  '6_MONTHS',
  '1_YEAR',
  'CUSTOM',
]);

export const analyticsQuerySchema = z.object({
  timeframe: timeframeSchema.optional().default('30_DAYS'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const reportQuerySchema = z.object({
  module: z.enum([
    'PATIENTS',
    'DOCTORS',
    'APPOINTMENTS',
    'REVENUE',
    'PHARMACY',
    'LABS',
    'BEDS',
    'EMERGENCY',
    'BLOOD_BANK',
    'INSURANCE',
    'STAFF',
  ]),
  timeframe: timeframeSchema.optional().default('30_DAYS'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});

