import api from './api';

export interface EmrTimelineItem {
  id: string;
  type: 'CONSULTATION' | 'VITALS' | 'PRESCRIPTION' | 'LAB_ORDER' | 'RADIOLOGY' | 'PROCEDURE' | 'ADMISSION' | 'DOCUMENT';
  date: string;
  title: string;
  subtitle?: string;
  doctorName?: string;
  departmentName?: string;
  details: Record<string, any>;
}

export interface EmrTimelineResponse {
  patient: {
    id: string;
    uhid: string;
    mrn: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup?: string;
    allergies?: string;
    existingConditions?: string;
    medicalHistory?: string;
  };
  timeline: EmrTimelineItem[];
  summary: {
    consultationsCount: number;
    vitalsCount: number;
    prescriptionsCount: number;
    labOrdersCount: number;
    radiologyCount: number;
    documentsCount: number;
  };
}

export const emrService = {
  getPatientEmrTimeline: async (patientId: string): Promise<EmrTimelineResponse> => {
    const res = await api.get(`/emr/patients/${patientId}/emr-timeline`);
    return res.data.data;
  },

  createRadiologyReport: async (data: {
    patientId: string;
    doctorId?: string;
    studyType: string;
    bodyPart?: string;
    findings: string;
    impression?: string;
  }) => {
    const res = await api.post(`/emr/patients/${data.patientId}/radiology`, {
      ...data,
      imagingType: data.studyType,
    });
    return res.data.data;
  },

  createProcedureRecord: async (data: {
    patientId: string;
    doctorId?: string;
    procedureName: string;
    procedureCode?: string;
    notes?: string;
    performedAt?: string;
  }) => {
    const res = await api.post(`/emr/patients/${data.patientId}/procedures`, {
      ...data,
      procedureDate: data.performedAt,
    });
    return res.data.data;
  },

  createAdmissionRecord: async (data: {
    patientId: string;
    doctorId?: string;
    admissionDate: string;
    reason: string;
    roomNumber?: string;
    bedNumber?: string;
  }) => {
    const res = await api.post(`/emr/patients/${data.patientId}/admissions`, {
      ...data,
      admissionReason: data.reason,
    });
    return res.data.data;
  },
};

