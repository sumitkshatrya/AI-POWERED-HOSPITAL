import api from './api';

export interface DoctorScheduleData {
  id?: string;
  doctorId: string;
  workingDays: string[];
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  slotDurationMinutes: number;
  maxAppointmentsPerDay: number;
  leaves: Array<{ id?: string; fromDate: string; toDate: string; reason?: string }>;
  holidays: string[];
  allowOnline: boolean;
}

export interface AvailableSlot {
  slotStartTime: string;
  slotEndTime: string;
  available: boolean;
  reason?: 'AVAILABLE' | 'BOOKED' | 'BREAK' | 'MAX_REACHED' | 'LEAVE' | 'HOLIDAY' | 'NOT_WORKING_DAY';
}

export interface AvailabilityResponse {
  doctorId: string;
  date: string;
  isWorkingDay: boolean;
  isOnLeave: boolean;
  isHoliday: boolean;
  maxAppointmentsPerDay: number;
  totalBooked: number;
  allowOnline: boolean;
  slots: AvailableSlot[];
}

export interface AppointmentData {
  id: string;
  hospitalId?: string;
  branchId: string;
  departmentId?: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  slotStartTime: string;
  slotEndTime: string;
  appointmentType: 'OPD' | 'FOLLOW_UP' | 'VIDEO' | 'EMERGENCY' | string;
  reasonForVisit?: string;
  fee: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  cancelReason?: string;
  patient?: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    phone: string;
    bloodGroup?: string;
  };
  doctor?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    specialization: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export const appointmentService = {
  getAvailableSlots: async (doctorId: string, date: string): Promise<AvailabilityResponse> => {
    const res = await api.get(`/appointments/available-slots`, { params: { doctorId, date } });
    return res.data.data;
  },

  createAppointment: async (payload: {
    hospitalId?: string;
    branchId: string;
    departmentId?: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    slotStartTime: string;
    slotEndTime: string;
    appointmentType: string;
    reasonForVisit?: string;
    fee?: number;
  }): Promise<AppointmentData> => {
    const res = await api.post('/appointments', payload);
    return res.data.data.appointment;
  },

  getAppointments: async (params?: {
    branchId?: string;
    hospitalId?: string;
    doctorId?: string;
    patientId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<AppointmentData[]> => {
    const res = await api.get('/appointments', { params });
    return res.data.data.appointments;
  },

  getAppointmentById: async (id: string): Promise<AppointmentData> => {
    const res = await api.get(`/appointments/${id}`);
    return res.data.data.appointment;
  },

  cancelAppointment: async (id: string, reason?: string): Promise<AppointmentData> => {
    const res = await api.post(`/appointments/${id}/cancel`, { reason });
    return res.data.data.appointment;
  },

  rescheduleAppointment: async (
    id: string,
    payload: { appointmentDate: string; slotStartTime: string; slotEndTime: string }
  ): Promise<AppointmentData> => {
    const res = await api.post(`/appointments/${id}/reschedule`, payload);
    return res.data.data.appointment;
  },

  updateStatus: async (id: string, status: string): Promise<AppointmentData> => {
    const res = await api.patch(`/appointments/${id}/status`, { status });
    return res.data.data.appointment;
  },

  checkIn: async (id: string): Promise<{ appointment: AppointmentData; opdQueue: any }> => {
    const res = await api.post(`/appointments/${id}/check-in`);
    return res.data.data;
  },

  getDoctorSchedule: async (doctorId: string): Promise<DoctorScheduleData> => {
    const res = await api.get(`/doctors/${doctorId}/schedule`);
    return res.data.data.schedule;
  },

  updateDoctorSchedule: async (doctorId: string, schedule: Partial<DoctorScheduleData>): Promise<DoctorScheduleData> => {
    const res = await api.put(`/doctors/${doctorId}/schedule`, schedule);
    return res.data.data.schedule;
  },
};

