import { Role } from './roles';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  hospitalId: string | null;
  branchId: string | null;
  isEmailVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantId?: string | null;
      branchId?: string | null;
    }
  }
}

