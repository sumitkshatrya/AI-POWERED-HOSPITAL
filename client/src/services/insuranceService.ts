import api from './api';

export interface PatientInsurance {
  id: string;
  patientId: string;
  provider: string;
  policyNumber: string;
  policyHolderName: string;
  coverageAmount: number;
  validFrom: string;
  validTo: string;
  copayPercentage: number;
  deductible: number;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  notes?: string | null;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
  };
  _count?: {
    claims: number;
  };
  createdAt: string;
}

export interface ClaimDocument {
  name: string;
  url: string;
  type?: string;
  uploadedAt?: string;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patientId: string;
  insuranceId: string;
  invoiceId?: string | null;
  hospitalId?: string | null;
  branchId?: string | null;
  treatmentDescription: string;
  diagnosis?: string | null;
  claimedAmount: number;
  approvedAmount: number;
  settledAmount: number;
  documents?: string | null; // JSON string of ClaimDocument[]
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED';
  adjudicationNotes?: string | null;
  denialReason?: string | null;
  submittedAt?: string | null;
  settledAt?: string | null;
  createdAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    phone?: string;
  };
  insurance?: {
    id: string;
    provider: string;
    policyNumber: string;
    coverageAmount: number;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paymentStatus: string;
  } | null;
}

export interface InsuranceDashboardSummary {
  totalClaims: number;
  draftCount: number;
  submittedCount: number;
  underReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
  settledCount: number;
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  totalSettledAmount: number;
  totalActivePolicies: number;
}

export const insuranceService = {
  getDashboardSummary: async (): Promise<InsuranceDashboardSummary> => {
    const res = await api.get('/billing/insurance/dashboard');
    return res.data.data.summary;
  },

  getPolicies: async (params?: { patientId?: string; status?: string }): Promise<PatientInsurance[]> => {
    const res = await api.get('/billing/insurance/policies', { params });
    return res.data.data.policies;
  },

  createPolicy: async (data: {
    patientId: string;
    provider: string;
    policyNumber: string;
    policyHolderName: string;
    coverageAmount: number;
    validFrom: string;
    validTo: string;
    copayPercentage?: number;
    deductible?: number;
    status?: string;
    notes?: string;
  }): Promise<PatientInsurance> => {
    const res = await api.post('/billing/insurance/policies', data);
    return res.data.data.policy;
  },

  getClaims: async (params?: {
    status?: string;
    patientId?: string;
    insuranceId?: string;
    search?: string;
  }): Promise<InsuranceClaim[]> => {
    const res = await api.get('/billing/insurance/claims', { params });
    return res.data.data.claims;
  },

  getClaimById: async (id: string): Promise<InsuranceClaim> => {
    const res = await api.get(`/billing/insurance/claims/${id}`);
    return res.data.data.claim;
  },

  createClaim: async (data: {
    patientId: string;
    insuranceId: string;
    invoiceId?: string;
    treatmentDescription: string;
    diagnosis?: string;
    claimedAmount: number;
    documents?: ClaimDocument[];
    status?: 'DRAFT' | 'SUBMITTED';
  }): Promise<InsuranceClaim> => {
    const res = await api.post('/billing/insurance/claims', data);
    return res.data.data.claim;
  },

  adjudicateClaim: async (
    id: string,
    data: {
      status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED';
      approvedAmount?: number;
      settledAmount?: number;
      adjudicationNotes?: string;
      denialReason?: string;
    }
  ): Promise<InsuranceClaim> => {
    const res = await api.put(`/billing/insurance/claims/${id}/status`, data);
    return res.data.data.claim;
  },
};

