import api from './api';

export interface DoctorListItem {
  id: string;
  userId: string;
  name: string;
  photo: string;
  registrationNumber: string;
  qualification: string;
  specialization: string;
  experience: number;
  languages: string[];
  fee: number;
  followupFee?: number;
  rating: number;
  totalReviews: number;
  isOnlineAvailable: boolean;
  hospital?: { id: string; name: string; logoUrl?: string };
  branch?: { id: string; name: string; city: string; address: string };
  department?: { id: string; name: string; code: string };
  availabilityHours?: { day: string; slots: string[] }[];
  bio?: string;
  services?: string[];
  reviews?: { id: string; rating: number; comment?: string; createdAt: string; patient?: { firstName: string; lastName: string } }[];
}

export interface DoctorDashboardMetrics {
  todayAppointments: number;
  upcomingAppointments: number;
  totalPatients: number;
  pendingConsultations: number;
  followUps: number;
  revenue: number;
}

export const doctorService = {
  async getDoctors(params: {
    search?: string;
    specialty?: string;
    location?: string;
    hospitalId?: string;
    branchId?: string;
    minFee?: number;
    maxFee?: number;
    isOnlineAvailable?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ doctors: DoctorListItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await api.get('/doctors', { params });
    return res.data.data;
  },

  async getDoctorById(id: string): Promise<DoctorListItem> {
    const res = await api.get(`/doctors/${id}`);
    return res.data.data.doctor;
  },

  async getDoctorDashboard(): Promise<{ metrics: DoctorDashboardMetrics; recentPatients: any[] }> {
    const res = await api.get('/doctors/me/dashboard');
    return res.data.data;
  },

  async updateDoctorProfile(id: string, data: Partial<DoctorListItem>): Promise<DoctorListItem> {
    const res = await api.put(`/doctors/${id}`, data);
    return res.data.data.doctor;
  },

  async postDoctorReview(doctorId: string, data: { patientId: string; rating: number; comment?: string }): Promise<any> {
    const res = await api.post(`/doctors/${doctorId}/reviews`, data);
    return res.data.data.review;
  },
};

