import api from './api';

export interface HospitalInventoryItem {
  id: string;
  name: string;
  itemCode: string;
  category: 'MEDICAL_EQUIPMENT' | 'SURGICAL_SUPPLIES' | 'CONSUMABLES' | 'PPE' | 'SYRINGES' | 'GLOVES' | 'MASKS' | 'OTHER';
  unitOfMeasure: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  locationRoom?: string | null;
  supplierId?: string | null;
  supplier?: { id: string; name: string; phone: string };
  lastRestockedAt?: string | null;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MAINTENANCE';
  createdAt?: string;
}

export const hospitalInventoryService = {
  getInventoryItems: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: HospitalInventoryItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
    const res = await api.get('/inventory', { params });
    return res.data.data;
  },

  getInventoryItemById: async (id: string): Promise<HospitalInventoryItem> => {
    const res = await api.get(`/inventory/${id}`);
    return res.data.data.item;
  },

  createInventoryItem: async (data: Partial<HospitalInventoryItem>): Promise<HospitalInventoryItem> => {
    const res = await api.post('/inventory', data);
    return res.data.data.item;
  },

  updateInventoryItem: async (id: string, data: Partial<HospitalInventoryItem>): Promise<HospitalInventoryItem> => {
    const res = await api.put(`/inventory/${id}`, data);
    return res.data.data.item;
  },

  consumeInventoryItem: async (id: string, data: { quantity: number; notes?: string }): Promise<HospitalInventoryItem> => {
    const res = await api.post(`/inventory/${id}/consume`, data);
    return res.data.data.item;
  },
};

