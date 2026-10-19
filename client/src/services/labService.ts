import api from './api';

export interface LabCatalogItem {
  id: string;
  testCode: string;
  testName: string;
  category: 'HAEMATOLOGY' | 'BIOCHEMISTRY' | 'MICROBIOLOGY' | 'SEROLOGY' | 'PATHOLOGY';
  specimenType: string;
  containerType: string;
  price: number;
  referenceRangeMin?: number | null;
  referenceRangeMax?: number | null;
  unit?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LabOrderItem {
  id: string;
  labOrderId: string;
  testName: string;
  testCode?: string | null;
  specimenType?: string | null;
  fee: number;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'VERIFIED';
  result?: string | null;
  resultValue?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  flag?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | null;
  technicianNotes?: string | null;
  catalog?: LabCatalogItem | null;
}

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  doctorId: string;
  consultationId?: string | null;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'VERIFIED';
  totalFee: number;
  sampleCollectedAt?: string | null;
  sampleBarcode?: string | null;
  verifiedAt?: string | null;
  remarks?: string | null;
  createdAt: string;
  patient: {
    id: string;
    uhid: string;
    mrn?: string | null;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
  };
  doctor?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  items: LabOrderItem[];
  sampleCollector?: { firstName: string; lastName: string } | null;
  verifiedBy?: { firstName: string; lastName: string } | null;
}

export const labService = {
  getLabCatalog: async (params?: { category?: string; search?: string; status?: string }): Promise<LabCatalogItem[]> => {
    const res = await api.get('/labs/catalog', { params });
    return res.data.data.catalog;
  },

  createLabCatalogItem: async (data: Partial<LabCatalogItem>): Promise<LabCatalogItem> => {
    const res = await api.post('/labs/catalog', data);
    return res.data.data.catalogItem;
  },

  getLabOrders: async (params?: { patientId?: string; status?: string; search?: string }): Promise<LabOrder[]> => {
    const res = await api.get('/labs/orders', { params });
    return res.data.data.labOrders;
  },

  getLabOrderById: async (id: string): Promise<LabOrder> => {
    const res = await api.get(`/labs/orders/${id}`);
    return res.data.data.labOrder;
  },

  collectSample: async (id: string, sampleBarcode?: string, remarks?: string): Promise<LabOrder> => {
    const res = await api.post(`/labs/orders/${id}/collect-sample`, { sampleBarcode, remarks });
    return res.data.data.labOrder;
  },

  enterResults: async (
    id: string,
    items: Array<{
      itemId: string;
      resultValue: string;
      unit?: string;
      referenceRange?: string;
      flag?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
      technicianNotes?: string;
    }>,
    remarks?: string
  ): Promise<LabOrder> => {
    const res = await api.post(`/labs/orders/${id}/results`, { items, remarks });
    return res.data.data.labOrder;
  },

  verifyOrder: async (id: string, remarks?: string): Promise<LabOrder> => {
    const res = await api.post(`/labs/orders/${id}/verify`, { remarks });
    return res.data.data.labOrder;
  },

  getLabReportPdfUrl: (orderId: string): string => {
    const rawBase = (import.meta as any).env?.VITE_API_URL;
    const baseURL = rawBase && rawBase.trim() !== '' ? rawBase.replace(/\/+$/, '') : '/api/v1';
    return `${baseURL}/labs/orders/${orderId}/pdf`;
  },
};
