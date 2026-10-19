import api from './api';

export interface IcuMonitoringLog {
  id: string;
  admissionId: string;
  recordedById: string;
  recordedAt: string;
  heartRate: number;
  systolicBp: number;
  diastolicBp: number;
  meanArterialPressure?: number | null;
  spo2: number;
  respiratoryRate: number;
  temperature: number;
  ventilatorMode?: string | null;
  fio2?: number | null;
  peep?: number | null;
  tidalVolume?: number | null;
  gcsScore?: number | null;
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  telemetryNotes?: string | null;
  recordedBy?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface IcuActivePatient {
  bedId: string;
  bedNumber: string;
  roomNumber?: string | null;
  wardName: string;
  admissionId: string;
  admissionNumber: string;
  admissionDate: string;
  admissionReason: string;
  patient: {
    id: string;
    uhid: string;
    mrn?: string | null;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup?: string | null;
    allergies?: string | null;
  };
  doctor?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  latestTelemetry?: IcuMonitoringLog | null;
  recentTelemetry?: IcuMonitoringLog[];
  upcomingMedications?: Array<{
    id: string;
    medicineName: string;
    dosage: string;
    route: string;
    scheduledTime: string;
  }>;
}

export interface IcuDashboardSummary {
  totalIcuBeds: number;
  occupiedIcuBeds: number;
  availableIcuBeds: number;
  criticalAlertsCount: number;
  ventilatorPatientsCount: number;
  occupancyRate: number;
}

export interface IcuDashboardData {
  summary: IcuDashboardSummary;
  activePatients: IcuActivePatient[];
  allIcuBeds: Array<{
    id: string;
    bedNumber: string;
    roomNumber?: string | null;
    status: string;
    ward: { name: string; code: string };
  }>;
}

export const icuService = {
  getIcuDashboard: async () => {
    const res = await api.get('/ipd/icu/dashboard');
    return res.data.data as IcuDashboardData;
  },

  recordTelemetry: async (
    admissionId: string,
    data: {
      heartRate: number;
      systolicBp: number;
      diastolicBp: number;
      spo2: number;
      respiratoryRate: number;
      temperature: number;
      ventilatorMode?: string;
      fio2?: number;
      peep?: number;
      tidalVolume?: number;
      gcsScore?: number;
      telemetryNotes?: string;
    }
  ) => {
    const res = await api.post(`/ipd/icu/admissions/${admissionId}/telemetry`, data);
    return res.data.data as IcuMonitoringLog;
  },
};

