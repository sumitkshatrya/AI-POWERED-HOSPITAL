import api from './api';

export interface Ward {
  id: string;
  hospitalId: string;
  branchId?: string | null;
  name: string;
  code: string;
  category: 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE' | 'ICU' | 'NICU' | 'EMERGENCY';
  floor?: string | null;
  totalBeds: number;
  dailyRate: number;
  description?: string | null;
  bedStats?: {
    total: number;
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
    reserved: number;
  };
  beds?: Bed[];
}

export interface Bed {
  id: string;
  hospitalId: string;
  branchId?: string | null;
  wardId: string;
  bedNumber: string;
  roomNumber?: string | null;
  category: 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE' | 'ICU' | 'NICU' | 'EMERGENCY';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'MAINTENANCE';
  dailyRate: number;
  features?: string | null;
  currentAdmissionId?: string | null;
  ward?: {
    id: string;
    name: string;
    code: string;
    floor?: string | null;
  };
  admissions?: Array<{
    id: string;
    admissionNumber: string;
    admissionDate: string;
    patient: {
      id: string;
      uhid: string;
      firstName: string;
      lastName: string;
      gender: string;
    };
    doctor?: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
}

export interface BedMatrixSummary {
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  cleaningBeds: number;
  maintenanceBeds: number;
  reservedBeds: number;
  occupancyRate: number;
}

export interface BedMatrixResponse {
  summary: BedMatrixSummary;
  beds: Bed[];
}

export const bedService = {
  getWards: async (branchId?: string) => {
    const res = await api.get('/ipd/wards', { params: { branchId } });
    return res.data.data as Ward[];
  },

  createWard: async (data: {
    name: string;
    code: string;
    category?: string;
    floor?: string;
    totalBeds?: number;
    dailyRate?: number;
    description?: string;
    branchId?: string;
  }) => {
    const res = await api.post('/ipd/wards', data);
    return res.data.data as Ward;
  },

  getBedsMatrix: async (params?: { category?: string; status?: string; wardId?: string }) => {
    const res = await api.get('/ipd/beds', { params });
    return res.data.data as BedMatrixResponse;
  },

  createBed: async (data: {
    wardId: string;
    bedNumber: string;
    roomNumber?: string;
    category?: string;
    dailyRate?: number;
    features?: string;
  }) => {
    const res = await api.post('/ipd/beds', data);
    return res.data.data as Bed;
  },

  updateBedStatus: async (bedId: string, status: string, notes?: string) => {
    const res = await api.put(`/ipd/beds/${bedId}/status`, { status, notes });
    return res.data.data as Bed;
  },
};

