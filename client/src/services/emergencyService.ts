import api from './api';

export interface EmergencyVisit {
  id: string;
  visitNumber: string;
  hospitalId?: string | null;
  branchId?: string | null;
  patientId?: string | null;
  unknownPatientName?: string | null;
  gender?: string | null;
  ageEstimate?: number | null;
  arrivalTime: string;
  emergencyType: 'TRAUMA' | 'CARDIAC' | 'RESPIRATORY' | 'STROKE' | 'BURNS' | 'POISONING' | 'PEDIATRIC' | 'GENERAL';
  chiefComplaint: string;
  initialVitals?: string | null;
  triageLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  triageNotes?: string | null;
  triageVerifiedAt?: string | null;
  clinicalDisclaimer: string;
  assignedDoctorId?: string | null;
  status: 'ACTIVE' | 'WAITING' | 'CRITICAL' | 'STABILIZED' | 'ADMITTED' | 'DISCHARGED';
  dischargeNotes?: string | null;
  dischargedAt?: string | null;
  patient?: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    gender: string;
    bloodGroup?: string | null;
  } | null;
  assignedDoctor?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  triageVerifiedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export interface EmergencyDashboardSummary {
  activeVisits: number;
  waitingVisits: number;
  criticalVisits: number;
  stabilizedVisits: number;
  admittedVisits: number;
  dischargedVisits: number;
  todayRegistrations: number;
  triageBreakdown: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

export interface EmergencyDashboardData {
  summary: EmergencyDashboardSummary;
  clinicalDisclaimer: string;
  recentVisits: EmergencyVisit[];
}

export const emergencyService = {
  getVisits: async (params?: { status?: string; triageLevel?: string; emergencyType?: string; search?: string }) => {
    const res = await api.get('/emergency/visits', { params });
    return res.data.data as EmergencyVisit[];
  },

  getDashboard: async () => {
    const res = await api.get('/emergency/dashboard');
    return res.data.data as EmergencyDashboardData;
  },

  createVisit: async (data: {
    patientId?: string;
    unknownPatientName?: string;
    gender?: string;
    ageEstimate?: number;
    emergencyType: string;
    chiefComplaint: string;
    initialVitals?: {
      heartRate?: number;
      systolicBp?: number;
      diastolicBp?: number;
      spo2?: number;
      respiratoryRate?: number;
      temperature?: number;
      gcsScore?: number;
    };
    triageLevel?: string;
    triageNotes?: string;
    assignedDoctorId?: string;
  }) => {
    const res = await api.post('/emergency/visits', data);
    return res.data.data as EmergencyVisit;
  },

  updateTriage: async (
    visitId: string,
    data: {
      triageLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      triageNotes?: string;
      clinicalVerification?: boolean;
    }
  ) => {
    const res = await api.put(`/emergency/visits/${visitId}/triage`, data);
    return res.data.data as EmergencyVisit;
  },

  updateStatus: async (
    visitId: string,
    data: {
      status: 'ACTIVE' | 'WAITING' | 'CRITICAL' | 'STABILIZED' | 'ADMITTED' | 'DISCHARGED';
      dischargeNotes?: string;
      assignedDoctorId?: string;
      admissionId?: string;
    }
  ) => {
    const res = await api.put(`/emergency/visits/${visitId}/status`, data);
    return res.data.data as EmergencyVisit;
  },
};

