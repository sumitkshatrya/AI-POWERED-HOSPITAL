import api from './api';

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  hospitalId?: string | null;
  branchId?: string | null;
  model?: string | null;
  ambulanceType: 'BLS' | 'ALS' | 'PATIENT_TRANSPORT' | 'MOBILE_ICU';
  driverName: string;
  driverPhone: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'EN_ROUTE' | 'AT_LOCATION' | 'TRANSPORTING' | 'COMPLETED' | 'MAINTENANCE';
  currentLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  lastGpsPingAt?: string | null;
  equipment?: string | null;
  dispatches?: AmbulanceDispatch[];
}

export interface AmbulanceDispatch {
  id: string;
  dispatchNumber: string;
  ambulanceId: string;
  hospitalId?: string | null;
  branchId?: string | null;
  callerName: string;
  callerPhone: string;
  pickupLocation: string;
  destinationLocation: string;
  emergencyDescription: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  patientId?: string | null;
  status: 'ASSIGNED' | 'EN_ROUTE' | 'AT_LOCATION' | 'TRANSPORTING' | 'COMPLETED' | 'CANCELLED';
  assignedAt: string;
  enRouteAt?: string | null;
  arrivedAtLocationAt?: string | null;
  transportingAt?: string | null;
  completedAt?: string | null;
  paramedicNotes?: string | null;
  ambulance?: Ambulance;
  patient?: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
}

export interface AmbulanceFleetSummary {
  total: number;
  available: number;
  assigned: number;
  enRoute: number;
  atLocation: number;
  transporting: number;
  maintenance: number;
}

export const ambulanceService = {
  getVehicles: async (params?: { status?: string; ambulanceType?: string; search?: string }) => {
    const res = await api.get('/ambulance/vehicles', { params });
    return res.data.data as { summary: AmbulanceFleetSummary; ambulances: Ambulance[] };
  },

  createVehicle: async (data: {
    vehicleNumber: string;
    model?: string;
    ambulanceType?: string;
    driverName: string;
    driverPhone: string;
    currentLocation?: string;
    equipment?: string[];
    branchId?: string;
  }) => {
    const res = await api.post('/ambulance/vehicles', data);
    return res.data.data as Ambulance;
  },

  updateVehicleStatus: async (
    id: string,
    data: {
      status: string;
      currentLocation?: string;
      latitude?: number;
      longitude?: number;
      speed?: number;
      heading?: number;
    }
  ) => {
    const res = await api.put(`/ambulance/vehicles/${id}/status`, data);
    return res.data.data as Ambulance;
  },

  getDispatches: async (params?: { status?: string; priority?: string; ambulanceId?: string }) => {
    const res = await api.get('/ambulance/dispatches', { params });
    return res.data.data as AmbulanceDispatch[];
  },

  createDispatch: async (data: {
    ambulanceId?: string;
    callerName: string;
    callerPhone: string;
    pickupLocation: string;
    destinationLocation?: string;
    emergencyDescription: string;
    priority?: string;
    patientId?: string;
    branchId?: string;
  }) => {
    const res = await api.post('/ambulance/dispatches', data);
    return res.data.data as AmbulanceDispatch;
  },

  updateDispatchStatus: async (
    id: string,
    data: {
      status: 'ASSIGNED' | 'EN_ROUTE' | 'AT_LOCATION' | 'TRANSPORTING' | 'COMPLETED' | 'CANCELLED';
      paramedicNotes?: string;
      latitude?: number;
      longitude?: number;
    }
  ) => {
    const res = await api.put(`/ambulance/dispatches/${id}/status`, data);
    return res.data.data as AmbulanceDispatch;
  },
};

