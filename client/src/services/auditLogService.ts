import api from './api';

export interface AuditLogEntry {
  id: string;
  hospitalId: string | null;
  branchId: string | null;
  userId: string | null;
  action: string;
  resource: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  hospital?: {
    id: string;
    name: string;
    code: string;
  } | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const auditLogService = {
  getLogs: async (params?: {
    action?: string;
    resource?: string;
    userId?: string;
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogResponse> => {
    const res = await api.get('/audit-logs', { params });
    return res.data.data;
  },
};

