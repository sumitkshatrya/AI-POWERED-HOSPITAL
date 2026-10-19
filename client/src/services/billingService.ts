import api from './api';

export type ServiceCategory =
  | 'CONSULTATION'
  | 'ROOM'
  | 'BED'
  | 'ICU'
  | 'PHARMACY'
  | 'LABORATORY'
  | 'RADIOLOGY'
  | 'PROCEDURES'
  | 'SURGERY'
  | 'EMERGENCY'
  | 'OTHER'
  | 'LAB_TEST'
  | 'MEDICINE';

export interface InvoiceItem {
  id: string;
  description: string;
  itemType: ServiceCategory;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentRecord {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  gateway: string;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  status: string;
  refundAmount: number;
  refundReason?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  doctorId?: string | null;
  appointmentId?: string | null;
  consultationId?: string | null;
  emergencyVisitId?: string | null;
  admissionId?: string | null;
  hospitalId: string;
  branchId: string;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  paymentMethod?: string | null;
  paidAt?: string | null;
  items: InvoiceItem[];
  payments?: PaymentRecord[];
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    phone?: string;
    address?: string;
  };
  doctor?: {
    user?: {
      firstName: string;
      lastName: string;
    };
    specialization?: string;
  };
  createdAt: string;
}

export interface AccountantDashboardData {
  summary: {
    totalRevenue: number;
    totalReceivables: number;
    todayRevenue: number;
    totalInvoices: number;
    pendingCount: number;
    partialCount: number;
    paidCount: number;
    refundedCount: number;
  };
  revenueByCategory: Record<string, number>;
  revenueByMethod: Record<string, number>;
  recentInvoices: Invoice[];
}

export const billingService = {
  getInvoices: async (params?: {
    patientId?: string;
    branchId?: string;
    paymentStatus?: string;
    search?: string;
  }): Promise<Invoice[]> => {
    const res = await api.get('/billing/invoices', { params });
    return res.data.data.invoices;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const res = await api.get(`/billing/invoices/${id}`);
    return res.data.data.invoice;
  },

  createInvoice: async (data: {
    patientId: string;
    doctorId?: string;
    branchId?: string;
    tax?: number;
    discount?: number;
    items: Array<{
      description: string;
      itemType: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<Invoice> => {
    const res = await api.post('/billing/invoices', data);
    return res.data.data.invoice;
  },

  payInvoice: async (id: string, paymentMethod: string): Promise<Invoice> => {
    const res = await api.post(`/billing/invoices/${id}/pay`, { paymentMethod });
    return res.data.data.invoice;
  },

  getAccountantDashboard: async (): Promise<AccountantDashboardData> => {
    const res = await api.get('/billing/dashboard');
    return res.data.data;
  },

  downloadInvoicePdf: async (invoiceId: string, invoiceNumber: string): Promise<void> => {
    const res = await api.get(`/billing/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
