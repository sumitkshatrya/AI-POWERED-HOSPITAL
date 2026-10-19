export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HOSPITAL_ADMIN = 'HOSPITAL_ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST',
  PHARMACIST = 'PHARMACIST',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  RADIOLOGIST = 'RADIOLOGIST',
  ACCOUNTANT = 'ACCOUNTANT',
  INSURANCE_STAFF = 'INSURANCE_STAFF',
  AMBULANCE_OPERATOR = 'AMBULANCE_OPERATOR',
  BLOOD_BANK_STAFF = 'BLOOD_BANK_STAFF',
  PATIENT = 'PATIENT',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  hospitalId?: string | null;
  branchId?: string | null;
  isEmailVerified: boolean;
  hospital?: { id: string; name: string; code: string };
  branch?: { id: string; name: string; code: string };
  createdAt?: string;
}

export interface AuthResponse {
  status: string;
  message?: string;
  data: {
    accessToken?: string;
    refreshToken?: string;
    user?: User;
    verificationToken?: string;
    resetToken?: string;
  };
}

