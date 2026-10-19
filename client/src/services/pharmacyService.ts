import api from './api';

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  minReorderLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  locationRack?: string | null;
  supplierId?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  supplier?: { id: string; name: string; phone: string };
  isLowStock?: boolean;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  daysUntilExpiry?: number;
  createdAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  taxId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  _count?: { medicines: number; inventoryItems: number };
}

export interface PharmacySaleItem {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNumber?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PharmacySale {
  id: string;
  saleNumber: string;
  patientId?: string | null;
  prescriptionId?: string | null;
  pharmacistId?: string | null;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  paymentMethod: string;
  remarks?: string | null;
  createdAt: string;
  items: PharmacySaleItem[];
  patient?: { id: string; firstName: string; lastName: string; uhid: string };
  pharmacist?: { id: string; firstName: string; lastName: string };
  prescription?: { id: string; prescriptionCode: string };
}

export interface PharmacyDashboardStats {
  summary: {
    totalMedicines: number;
    lowStockCount: number;
    expiringCount: number;
    expiredCount: number;
    todaysSalesAmount: number;
    todaysSalesCount: number;
    pendingPrescriptionsCount: number;
    hospitalInventoryLowStockCount: number;
  };
  alerts: Array<{
    id: string;
    medicineName: string;
    batchNumber: string;
    type: 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
    severity: 'HIGH' | 'MEDIUM' | 'CRITICAL';
    message: string;
    value: number | string;
  }>;
  recentTransactions: Array<{
    id: string;
    transactionType: string;
    quantityChange: number;
    previousQuantity: number;
    newQuantity: number;
    notes?: string | null;
    createdAt: string;
    medicine?: { name: string; batchNumber: string };
    inventoryItem?: { name: string; category: string };
    performedBy?: { firstName: string; lastName: string; role: string };
  }>;
}

export const pharmacyService = {
  getDashboardStats: async (): Promise<PharmacyDashboardStats> => {
    const res = await api.get('/pharmacy/dashboard/stats');
    return res.data.data;
  },

  getMedicines: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
    expired?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ medicines: Medicine[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
    const res = await api.get('/pharmacy/medicines', { params });
    return res.data.data;
  },

  getMedicineById: async (id: string): Promise<Medicine> => {
    const res = await api.get(`/pharmacy/medicines/${id}`);
    return res.data.data.medicine;
  },

  createMedicine: async (data: Partial<Medicine>): Promise<Medicine> => {
    const res = await api.post('/pharmacy/medicines', data);
    return res.data.data.medicine;
  },

  updateMedicine: async (id: string, data: Partial<Medicine>): Promise<Medicine> => {
    const res = await api.put(`/pharmacy/medicines/${id}`, data);
    return res.data.data.medicine;
  },

  adjustStock: async (id: string, data: { newQuantity: number; reason?: string }): Promise<Medicine> => {
    const res = await api.post(`/pharmacy/medicines/${id}/adjust-stock`, data);
    return res.data.data.medicine;
  },

  getSales: async (params?: { search?: string; patientId?: string; page?: number; limit?: number }): Promise<{ sales: PharmacySale[]; pagination: any }> => {
    const res = await api.get('/pharmacy/sales', { params });
    return res.data.data;
  },

  createSale: async (data: {
    patientId?: string;
    prescriptionId?: string;
    paymentMethod: string;
    discount?: number;
    remarks?: string;
    items: Array<{ medicineId: string; quantity: number; unitPrice?: number }>;
  }): Promise<PharmacySale> => {
    const res = await api.post('/pharmacy/sales', data);
    return res.data.data.sale;
  },

  fulfillPrescription: async (data: {
    prescriptionId: string;
    paymentMethod: string;
    discount?: number;
    remarks?: string;
  }): Promise<PharmacySale> => {
    const res = await api.post('/pharmacy/sales/fulfill-prescription', data);
    return res.data.data.sale;
  },

  getSuppliers: async (params?: { search?: string; status?: string }): Promise<Supplier[]> => {
    const res = await api.get('/pharmacy/suppliers', { params });
    return res.data.data.suppliers;
  },

  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.post('/pharmacy/suppliers', data);
    return res.data.data.supplier;
  },

  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.put(`/pharmacy/suppliers/${id}`, data);
    return res.data.data.supplier;
  },
};

