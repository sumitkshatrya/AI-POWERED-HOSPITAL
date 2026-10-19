export interface Hospital {
  id: string;
  name: string;
  code: string;
  logoUrl?: string | null;
  contactEmail: string;
  contactPhone: string;
  address?: string | null;
  website?: string | null;
  emergencyContact?: string | null;
  workingHours?: string | null;
  facilities: string[];
  taxId?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  _count?: {
    branches: number;
    departments: number;
    users: number;
  };
}

export interface Branch {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string | null;
  country: string;
  contactEmail: string;
  contactPhone: string;
  workingHours: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  hospital?: { id: string; name: string; code: string };
  _count?: {
    departments: number;
    users: number;
  };
}

export interface Department {
  id: string;
  hospitalId: string;
  branchId: string;
  name: string;
  code: string;
  description?: string | null;
  headDoctorId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  services: string[];
  workingHours?: string | null;
  headDoctor?: { id: string; firstName: string; lastName: string; email: string } | null;
  branch?: { id: string; name: string; code: string };
  _count?: {
    users: number;
  };
}

export interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  hospitalId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  specialization?: string | null;
  licenseNumber?: string | null;
  joiningDate?: string | null;
  profileImage?: string | null;
  isEmailVerified: boolean;
  department?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  hospital?: { id: string; name: string; code: string } | null;
}

