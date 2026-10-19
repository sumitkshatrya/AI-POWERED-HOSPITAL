import api from './api';

export interface BloodDonor {
  id: string;
  donorNumber: string;
  name: string;
  gender: string;
  age: number;
  bloodGroup: string;
  contactPhone: string;
  email?: string | null;
  address?: string | null;
  lastDonationDate?: string | null;
  eligibilityStatus: 'ELIGIBLE' | 'INELIGIBLE' | 'DEFERRED';
  medicalNotes?: string | null;
  _count?: { donations: number };
}

export interface BloodUnit {
  id: string;
  unitNumber: string;
  donorId?: string | null;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  componentType: 'WHOLE_BLOOD' | 'PRBC' | 'PLATELETS' | 'FFP' | 'CRYOPRECIPITATE';
  volumeMl: number;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  storageTemperature?: number | null;
  testingStatus: 'PASSED' | 'FAILED' | 'PENDING';
  screeningNotes?: string | null;
  status: 'AVAILABLE' | 'RESERVED' | 'ISSUED' | 'EXPIRED' | 'DISCARDED';
  reservedForPatientId?: string | null;
  reservedAt?: string | null;
  issuedAt?: string | null;
  issuedToPatientId?: string | null;
  crossmatchResult?: string | null;
  issueNotes?: string | null;
  isExpired?: boolean;
  donor?: { id: string; name: string; donorNumber: string; contactPhone: string } | null;
  reservedForPatient?: { id: string; firstName: string; lastName: string; uhid: string } | null;
  issuedToPatient?: { id: string; firstName: string; lastName: string; uhid: string } | null;
  issuedByUser?: { id: string; firstName: string; lastName: string } | null;
}

export interface BloodBankDashboardSummary {
  totalUnits: number;
  totalAvailable: number;
  totalReserved: number;
  totalIssued: number;
  totalExpired: number;
  totalDiscarded: number;
  expiringSoonCount: number;
  pendingTestingCount: number;
  totalDonors: number;
  bloodGroupStock: Record<string, number>;
}

export interface BloodBankDashboardData {
  summary: BloodBankDashboardSummary;
  recentUnits: BloodUnit[];
}

export const bloodBankService = {
  getDashboard: async () => {
    const res = await api.get('/blood-bank/dashboard');
    return res.data.data as BloodBankDashboardData;
  },

  getUnits: async (params?: { bloodGroup?: string; status?: string; componentType?: string; search?: string }) => {
    const res = await api.get('/blood-bank/units', { params });
    return res.data.data as BloodUnit[];
  },

  createUnit: async (data: {
    donorId?: string;
    bloodGroup: string;
    componentType?: string;
    volumeMl?: number;
    collectionDate?: string;
    expiryDate: string;
    storageLocation?: string;
    storageTemperature?: number;
    testingStatus?: string;
    screeningNotes?: string;
    branchId?: string;
  }) => {
    const res = await api.post('/blood-bank/units', data);
    return res.data.data as BloodUnit;
  },

  updateTest: async (id: string, data: { testingStatus: 'PASSED' | 'FAILED'; screeningNotes: string }) => {
    const res = await api.put(`/blood-bank/units/${id}/test`, data);
    return res.data.data as BloodUnit;
  },

  reserveUnit: async (id: string, data: { patientId: string; reason?: string }) => {
    const res = await api.post(`/blood-bank/units/${id}/reserve`, data);
    return res.data.data as BloodUnit;
  },

  issueUnit: async (
    id: string,
    data: {
      patientId: string;
      crossmatchResult: 'COMPATIBLE' | 'INCOMPATIBLE';
      issueNotes?: string;
    }
  ) => {
    const res = await api.post(`/blood-bank/units/${id}/issue`, data);
    return res.data.data as BloodUnit;
  },

  getDonors: async (params?: { bloodGroup?: string; search?: string }) => {
    const res = await api.get('/blood-bank/donors', { params });
    return res.data.data as BloodDonor[];
  },

  createDonor: async (data: {
    name: string;
    gender?: string;
    age: number;
    bloodGroup: string;
    contactPhone: string;
    email?: string;
    address?: string;
    medicalNotes?: string;
    branchId?: string;
  }) => {
    const res = await api.post('/blood-bank/donors', data);
    return res.data.data as BloodDonor;
  },
};

