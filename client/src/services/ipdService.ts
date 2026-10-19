import api from './api';

export interface AdmissionRecord {
  id: string;
  admissionNumber: string;
  hospitalId: string;
  branchId?: string | null;
  patientId: string;
  doctorId: string;
  wardId: string;
  bedId: string;
  admissionDate: string;
  admissionReason: string;
  initialDiagnosis?: string | null;
  status: 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED' | 'EXPIRED';
  dischargeDate?: string | null;
  patient: {
    id: string;
    uhid: string;
    mrn?: string | null;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    phone: string;
    bloodGroup?: string | null;
    allergies?: string | null;
  };
  doctor: {
    id: string;
    specialization?: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  ward: {
    id: string;
    name: string;
    code: string;
    category: string;
    floor?: string | null;
  };
  bed: {
    id: string;
    bedNumber: string;
    roomNumber?: string | null;
    category: string;
    dailyRate: number;
    status: string;
  };
  doctorRounds?: DoctorRound[];
  nursingNotes?: NursingNote[];
  medicationMARs?: MedicationMAR[];
  dischargeSummary?: DischargeSummary | null;
}

export interface DoctorRound {
  id: string;
  admissionId: string;
  doctorId: string;
  roundDate: string;
  clinicalNotes: string;
  treatmentOrders?: string | null;
  roundFee?: number;
  doctor?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface NursingNote {
  id: string;
  admissionId: string;
  nurseId: string;
  noteDate: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  vitalsBp?: string | null;
  vitalsPulse?: number | null;
  vitalsTemp?: number | null;
  vitalsSpo2?: number | null;
  vitalsResp?: number | null;
  carePlan?: string | null;
  interventions?: string | null;
  patientMood?: string | null;
  nurse?: {
    firstName: string;
    lastName: string;
  };
}

export interface MedicationMAR {
  id: string;
  admissionId: string;
  medicineName: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduledTime: string;
  administeredTime?: string | null;
  administeredBy?: string | null;
  status: 'SCHEDULED' | 'GIVEN' | 'MISSED' | 'HELD';
  notes?: string | null;
  nurse?: {
    firstName: string;
    lastName: string;
  };
}

export interface DischargeSummary {
  id: string;
  admissionId: string;
  doctorId: string;
  dischargeDate: string;
  dischargeDiagnosis: string;
  treatmentSummary: string;
  proceduresDone?: string | null;
  conditionAtDischarge: 'STABLE' | 'IMPROVED' | 'RECOVERED' | 'CRITICAL' | 'AGAINST_MEDICAL_ADVICE' | 'DECEASED';
  dischargeMedications?: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    route?: string;
    instructions?: string;
  }> | null;
  dietaryInstructions?: string | null;
  followUpDate?: string | null;
  followUpInstructions?: string | null;
  doctor?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export const ipdService = {
  getAdmissions: async (params?: { status?: string; wardId?: string; search?: string }) => {
    const res = await api.get('/ipd/admissions', { params });
    return res.data.data as AdmissionRecord[];
  },

  getAdmissionById: async (id: string) => {
    const res = await api.get(`/ipd/admissions/${id}`);
    return res.data.data as AdmissionRecord;
  },

  createAdmission: async (data: {
    patientId: string;
    doctorId: string;
    wardId: string;
    bedId: string;
    admissionReason: string;
    initialDiagnosis?: string;
  }) => {
    const res = await api.post('/ipd/admissions', data);
    return res.data.data as AdmissionRecord;
  },

  transferBed: async (admissionId: string, data: { newWardId: string; newBedId: string; reason: string }) => {
    const res = await api.post(`/ipd/admissions/${admissionId}/transfer`, {
      ...data,
      targetBedId: data.newBedId,
      transferReason: data.reason,
    });
    return res.data.data as AdmissionRecord;
  },

  getDoctorRounds: async (admissionId: string) => {
    const res = await api.get(`/ipd/admissions/${admissionId}/rounds`);
    return res.data.data as DoctorRound[];
  },

  createDoctorRound: async (
    admissionId: string,
    data: { clinicalNotes: string; treatmentOrders?: string; roundFee?: number }
  ) => {
    const res = await api.post(`/ipd/admissions/${admissionId}/rounds`, data);
    return res.data.data as DoctorRound;
  },

  getNursingNotes: async (admissionId: string) => {
    const res = await api.get(`/ipd/admissions/${admissionId}/nursing-notes`);
    return res.data.data as NursingNote[];
  },

  createNursingNote: async (
    admissionId: string,
    data: {
      shift: 'MORNING' | 'EVENING' | 'NIGHT';
      vitalsBp?: string;
      vitalsPulse?: number;
      vitalsTemp?: number;
      vitalsSpo2?: number;
      vitalsResp?: number;
      carePlan?: string;
      interventions?: string;
      patientMood?: string;
    }
  ) => {
    const res = await api.post(`/ipd/admissions/${admissionId}/nursing-notes`, data);
    return res.data.data as NursingNote;
  },

  getMarSchedules: async (admissionId?: string, status?: string) => {
    const res = await api.get('/ipd/mar', { params: { admissionId, status } });
    return res.data.data as MedicationMAR[];
  },

  scheduleMedicationMAR: async (
    admissionId: string,
    data: {
      medicineName: string;
      dosage: string;
      route?: string;
      frequency?: string;
      scheduledTime: string;
      notes?: string;
    }
  ) => {
    const res = await api.post(`/ipd/admissions/${admissionId}/mar`, data);
    return res.data.data as MedicationMAR;
  },

  updateMarStatus: async (marId: string, data: { status: 'GIVEN' | 'MISSED' | 'HELD'; notes?: string }) => {
    const res = await api.put(`/ipd/mar/${marId}/status`, data);
    return res.data.data as MedicationMAR;
  },

  finalizeDischarge: async (
    admissionId: string,
    data: {
      dischargeDiagnosis: string;
      treatmentSummary: string;
      proceduresDone?: string;
      conditionAtDischarge: string;
      dischargeMedications?: Array<{
        medicineName: string;
        dosage: string;
        frequency: string;
        duration: string;
        route?: string;
        instructions?: string;
      }>;
      dietaryInstructions?: string;
      followUpDate?: string;
      followUpInstructions?: string;
    }
  ) => {
    const res = await api.post(`/ipd/admissions/${admissionId}/discharge`, data);
    return res.data.data as { admission: AdmissionRecord; dischargeSummary: DischargeSummary; invoice: any };
  },

  downloadDischargePdf: async (admissionId: string, filename?: string) => {
    const res = await api.get(`/ipd/admissions/${admissionId}/discharge/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `Discharge_Summary_${admissionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

