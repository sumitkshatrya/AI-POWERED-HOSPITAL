import api from './api';

export interface RadiologyOrder {
  id: string;
  orderNumber: string;
  accessionNumber?: string | null;
  studyInstanceUid?: string | null;
  patientId: string;
  doctorId?: string | null;
  appointmentId?: string | null;
  imagingType: 'XRAY' | 'CT_SCAN' | 'MRI' | 'ULTRASOUND' | 'MAMMOGRAM' | 'PET_SCAN';
  bodyPart: string;
  clinicalHistory?: string | null;
  urgency: 'ROUTINE' | 'URGENT' | 'STAT';
  fee: number;
  status: 'ORDERED' | 'SCHEDULED' | 'SCAN_COMPLETED' | 'REPORT_DRAFTED' | 'VERIFIED';
  scheduledAt?: string | null;
  scanCompletedAt?: string | null;
  findings?: string | null;
  impression?: string | null;
  recommendations?: string | null;
  pacsViewerUrl?: string | null;
  dicomSeriesCount?: number | null;
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
  } | null;
  technician?: { firstName: string; lastName: string } | null;
  radiologist?: { firstName: string; lastName: string } | null;
  verifiedBy?: { firstName: string; lastName: string } | null;
}

export const radiologyService = {
  createOrder: async (data: {
    patientId: string;
    doctorId?: string;
    appointmentId?: string;
    imagingType: string;
    bodyPart: string;
    clinicalHistory?: string;
    urgency?: string;
    fee?: number;
  }): Promise<RadiologyOrder> => {
    const res = await api.post('/radiology/orders', data);
    return res.data.data.radiologyOrder;
  },

  getWorklist: async (params?: {
    imagingType?: string;
    status?: string;
    urgency?: string;
    patientId?: string;
    search?: string;
  }): Promise<RadiologyOrder[]> => {
    const res = await api.get('/radiology/worklist', { params });
    return res.data.data.radiologyOrders;
  },

  getOrderById: async (id: string): Promise<RadiologyOrder> => {
    const res = await api.get(`/radiology/orders/${id}`);
    return res.data.data.radiologyOrder;
  },

  scheduleScan: async (id: string, scheduledAt: string): Promise<RadiologyOrder> => {
    const res = await api.post(`/radiology/orders/${id}/schedule`, { scheduledAt });
    return res.data.data.radiologyOrder;
  },

  completeScan: async (id: string, dicomSeriesCount?: number): Promise<RadiologyOrder> => {
    const res = await api.post(`/radiology/orders/${id}/complete-scan`, { dicomSeriesCount });
    return res.data.data.radiologyOrder;
  },

  draftReport: async (
    id: string,
    findings: string,
    impression?: string,
    recommendations?: string
  ): Promise<RadiologyOrder> => {
    const res = await api.post(`/radiology/orders/${id}/report`, { findings, impression, recommendations });
    return res.data.data.radiologyOrder;
  },

  verifyReport: async (id: string, remarks?: string): Promise<RadiologyOrder> => {
    const res = await api.post(`/radiology/orders/${id}/verify`, { remarks });
    return res.data.data.radiologyOrder;
  },
};

