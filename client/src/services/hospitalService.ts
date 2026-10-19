import api from './api';
import { Hospital, Branch, Department, StaffMember } from '../types/hospital';

export const hospitalService = {
  // --- Hospital API ---
  async getHospitals(search?: string, status?: string): Promise<Hospital[]> {
    const params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const res = await api.get('/hospitals', { params });
    return res.data.data.hospitals;
  },

  async getHospitalById(id: string): Promise<Hospital> {
    const res = await api.get(`/hospitals/${id}`);
    return res.data.data.hospital;
  },

  async createHospital(data: Partial<Hospital>): Promise<Hospital> {
    const res = await api.post('/hospitals', data);
    return res.data.data.hospital;
  },

  async updateHospital(id: string, data: Partial<Hospital>): Promise<Hospital> {
    const res = await api.put(`/hospitals/${id}`, data);
    return res.data.data.hospital;
  },

  async deleteHospital(id: string): Promise<void> {
    await api.delete(`/hospitals/${id}`);
  },

  // --- Branch API ---
  async getBranches(hospitalId?: string, status?: string): Promise<Branch[]> {
    const params: any = {};
    if (hospitalId) params.hospitalId = hospitalId;
    if (status) params.status = status;
    const res = await api.get('/branches', { params });
    return res.data.data.branches;
  },

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const res = await api.post('/branches', data);
    return res.data.data.branch;
  },

  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const res = await api.put(`/branches/${id}`, data);
    return res.data.data.branch;
  },

  async deleteBranch(id: string): Promise<void> {
    await api.delete(`/branches/${id}`);
  },

  // --- Department API ---
  async getDepartments(branchId?: string): Promise<Department[]> {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    const res = await api.get('/departments', { params });
    return res.data.data.departments;
  },

  async seedDefaultDepartments(branchId?: string): Promise<Department[]> {
    const res = await api.post('/departments/seed-defaults', { branchId });
    return res.data.data.departments;
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const res = await api.post('/departments', data);
    return res.data.data.department;
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const res = await api.put(`/departments/${id}`, data);
    return res.data.data.department;
  },

  // --- Staff API ---
  async getStaff(params: {
    search?: string;
    role?: string;
    departmentId?: string;
    branchId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ staff: StaffMember[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await api.get('/staff', { params });
    const data = res.data.data;
    return {
      staff: data.staff || [],
      pagination: data.meta || data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  },

  async createStaff(data: Partial<StaffMember> & { password?: string }): Promise<StaffMember> {
    const res = await api.post('/staff', data);
    return res.data.data.staff;
  },

  async updateStaff(id: string, data: Partial<StaffMember>): Promise<StaffMember> {
    const res = await api.put(`/staff/${id}`, data);
    return res.data.data.staff;
  },

  async toggleStaffStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'): Promise<StaffMember> {
    const res = await api.patch(`/staff/${id}/status`, { status });
    return res.data.data.staff;
  },
};

