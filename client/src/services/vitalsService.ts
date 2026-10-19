import api from './api';

export interface VitalsRecord {
  id: string;
  patientId: string;
  recordedById?: string;
  appointmentId?: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  spO2?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  bloodGlucose?: number;
  notes?: string;
  createdAt: string;
}

export const vitalsService = {
  recordVitals: async (data: Partial<VitalsRecord>): Promise<VitalsRecord> => {
    const res = await api.post('/vitals', data);
    return res.data.data.vitalsRecord;
  },

  getPatientVitalsHistory: async (patientId: string): Promise<VitalsRecord[]> => {
    const res = await api.get(`/vitals/patients/${patientId}/vitals`);
    return res.data.data.vitalsHistory;
  },
};

