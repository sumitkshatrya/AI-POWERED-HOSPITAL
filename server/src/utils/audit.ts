import { AuditLog } from '../models';

export interface AuditParams {
  hospitalId?: string | null;
  branchId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const logAudit = async (params: AuditParams): Promise<void> => {
  try {
    await AuditLog.create({
      hospitalId: params.hospitalId || undefined,
      userId: params.userId || undefined,
      action: params.action,
      resource: params.resource,
      metadata: params.details ? { details: params.details } : undefined,
      ipAddress: params.ipAddress || undefined,
      userAgent: params.userAgent || undefined,
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
};

