import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  gateway: z.enum(['RAZORPAY', 'STRIPE']),
  amount: z.number().positive().optional(),
});

export const verifyPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  gateway: z.enum(['RAZORPAY', 'STRIPE']),
  gatewayOrderId: z.string().min(1, 'Gateway Order ID is required'),
  gatewayPaymentId: z.string().min(1, 'Gateway Payment ID is required'),
  gatewaySignature: z.string().min(1, 'Gateway Signature is required'),
});

export const recordManualPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'NET_BANKING', 'INSURANCE']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const refundPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(1, 'Refund reason is mandatory'),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RecordManualPaymentInput = z.infer<typeof recordManualPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

