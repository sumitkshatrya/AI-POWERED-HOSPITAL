import api from './api';

export interface PaymentInitiationResult {
  invoiceId: string;
  invoiceNumber: string;
  gateway: 'RAZORPAY' | 'STRIPE';
  gatewayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface PaymentVerificationResult {
  payment: {
    id: string;
    paymentNumber: string;
    amount: number;
    paymentMethod: string;
    gateway: string;
    status: string;
    createdAt: string;
  };
  invoice: any;
}

export const paymentService = {
  initiatePayment: async (data: {
    invoiceId: string;
    gateway: 'RAZORPAY' | 'STRIPE';
    amount?: number;
  }): Promise<PaymentInitiationResult> => {
    const res = await api.post('/billing/payments/initiate', data);
    return res.data.data;
  },

  verifyPayment: async (data: {
    invoiceId: string;
    gateway: 'RAZORPAY' | 'STRIPE';
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature: string;
  }): Promise<PaymentVerificationResult> => {
    const res = await api.post('/billing/payments/verify', data);
    return res.data.data;
  },

  recordManualPayment: async (data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'INSURANCE';
    referenceNumber?: string;
    notes?: string;
  }) => {
    const res = await api.post('/billing/payments/manual', data);
    return res.data.data;
  },

  refundPayment: async (
    paymentId: string,
    data: {
      amount?: number;
      reason: string;
    }
  ) => {
    const res = await api.post(`/billing/payments/${paymentId}/refund`, data);
    return res.data.data;
  },

  getTransactions: async (params?: { invoiceId?: string; status?: string; gateway?: string }) => {
    const res = await api.get('/billing/payments/transactions', { params });
    return res.data.data.payments;
  },
};

