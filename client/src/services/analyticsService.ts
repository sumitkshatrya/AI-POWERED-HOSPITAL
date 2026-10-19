import api from './api';

export interface AdminAnalyticsResponse {
  timeframe: string;
  kpis?: Record<string, any>;
  metrics?: {
    totalPatients: number;
    newPatients: number;
    returningPatients: number;
    totalAppointments: number;
    completedAppointments?: number;
    completedAppts?: number;
    cancelledAppointments?: number;
    noShowCount?: number;
    noShowAppts?: number;
    grossRevenue?: number;
    revenueTotal?: number;
    pendingRevenue?: number;
    unpaidInvoicesTotal?: number;
    estimatedExpenses?: number;
    totalBeds: number;
    occupiedBeds: number;
    bedOccupancyRate?: number;
    bedOccupancyPercentage?: number;
    emergencyCases: number;
    pharmacySalesTotal: number;
    pharmacyTransactionsCount: number;
    labTestVolume: number;
    insuranceClaimsPipeline?: Array<{ status: string; count: number; claimed?: number; settled?: number }>;
  };
  charts?: {
    appointmentStatusDonut?: Array<{ name: string; value: number }>;
    revenueExpenseTrend?: Array<{ name: string; revenue: number; expense: number }>;
  };
}

export interface RoleDashboardResponse {
  role: string;
  rolePayload: Record<string, any>;
}

export const analyticsService = {
  getAdminAnalytics: async (timeframe = '30_DAYS', startDate?: string, endDate?: string): Promise<AdminAnalyticsResponse> => {
    let url = `/analytics/admin?timeframe=${timeframe}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const res = await api.get(url);
    return res.data.data;
  },

  getRoleDashboard: async (): Promise<RoleDashboardResponse> => {
    const res = await api.get('/analytics/dashboard');
    return res.data.data;
  },
};

