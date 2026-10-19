import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models';
import { Role } from '../types/roles';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    if (![Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN].includes(currentUser.role as Role)) {
      res.status(403).json({ status: 'error', message: 'Access denied to system audit logs' });
      return;
    }

    const {
      action,
      resource,
      userId,
      hospitalId,
      startDate,
      endDate,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    // Scope isolation
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.hospitalId) {
      query.hospitalId = currentUser.hospitalId;
    } else if (hospitalId) {
      query.hospitalId = String(hospitalId);
    }

    if (action) {
      query.action = String(action);
    }

    if (resource) {
      query.resource = String(resource);
    }

    if (userId) {
      query.userId = String(userId);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(String(startDate));
      if (endDate) query.createdAt.$lte = new Date(String(endDate));
    }

    if (search) {
      const q = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { action: q },
        { resource: q },
        { 'metadata.details': q },
        { ipAddress: q },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'id email firstName lastName role')
        .populate('hospitalId', 'id name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    const formattedLogs = logs.map((l: any) => ({
      id: l._id.toString(),
      _id: l._id,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      details: l.metadata?.details || l.details || '',
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      createdAt: l.createdAt,
      user: l.userId && typeof l.userId === 'object'
        ? {
            id: l.userId._id?.toString() || l.userId.id,
            email: l.userId.email,
            firstName: l.userId.firstName,
            lastName: l.userId.lastName,
            role: l.userId.role,
          }
        : null,
      hospital: l.hospitalId && typeof l.hospitalId === 'object'
        ? {
            id: l.hospitalId._id?.toString() || l.hospitalId.id,
            name: l.hospitalId.name,
            code: l.hospitalId.code,
          }
        : null,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        logs: formattedLogs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
