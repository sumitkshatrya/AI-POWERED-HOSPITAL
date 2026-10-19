import { Request, Response, NextFunction } from 'express';
import { Branch } from '../models';
import { createBranchSchema, updateBranchSchema } from '../schemas/branch.schema';
import { logAudit } from '../utils/audit';
import { ConflictError, NotFoundError } from '../utils/errors';

const formatBranch = (b: any) => ({
  id: b._id ? b._id.toString() : b.id,
  _id: b._id,
  hospitalId: b.hospitalId?._id ? b.hospitalId._id.toString() : b.hospitalId?.toString() || null,
  name: b.name,
  code: b.code || b.name || '',
  address: b.address,
  phone: b.phone,
  email: b.email,
  workingHours: b.workingHours || null,
  status: b.isActive !== false ? 'ACTIVE' : 'INACTIVE',
  isActive: b.isActive !== false,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
  hospital: b.hospitalId && typeof b.hospitalId === 'object' ? {
    id: b.hospitalId._id.toString(),
    name: b.hospitalId.name,
    code: b.hospitalId.registrationNumber || null,
  } : null,
});

export const createBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createBranchSchema.parse(req.body);

    const hospitalId = data.hospitalId || req.user?.hospitalId;

    if (data.code || data.name) {
      const existing = await Branch.findOne({
        hospitalId,
        $or: [{ name: data.name }, ...(data.code ? [{ name: data.code }] : [])],
      });

      if (existing) {
        throw new ConflictError(`Branch with name/code '${data.name}' already exists in this hospital.`);
      }
    }

    const branch = await Branch.create({
      hospitalId,
      name: data.name,
      contactPhone: (data as any).phone || (data as any).contactPhone,
      contactEmail: (data as any).email || (data as any).contactEmail,
      workingHours: data.workingHours,
      isActive: data.status !== 'INACTIVE',
    });

    await logAudit({
      hospitalId: branch.hospitalId.toString(),
      branchId: branch._id.toString(),
      userId: req.user?.id,
      action: 'BRANCH_CREATED',
      resource: 'branches',
      details: `Created branch ${branch.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Branch created successfully.',
      data: { branch: formatBranch(branch) },
    });
  } catch (err) {
    next(err);
  }
};

export const getBranches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { hospitalId, search, status } = req.query;

    const query: any = {};

    if (hospitalId) {
      query.hospitalId = String(hospitalId);
    } else if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (status) {
      if (String(status) === 'ACTIVE') query.isActive = true;
      else if (String(status) === 'INACTIVE') query.isActive = false;
    }

    const branches = await Branch.find(query).populate('hospitalId').sort({ createdAt: -1 });

    const formatted = branches.map(formatBranch);

    res.status(200).json({
      status: 'success',
      data: { branches: formatted },
    });
  } catch (err) {
    next(err);
  }
};

export const getBranchById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = req.params.id as string;

    const branch = await Branch.findById(branchId).populate('hospitalId');

    if (!branch) {
      throw new NotFoundError('Branch record not found.');
    }

    res.status(200).json({
      status: 'success',
      data: { branch: formatBranch(branch) },
    });
  } catch (err) {
    next(err);
  }
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = req.params.id as string;
    const data = updateBranchSchema.parse(req.body);

    const existing = await Branch.findById(branchId);
    if (!existing) {
      throw new NotFoundError('Branch record not found.');
    }

    const { status, code, ...restData } = data;
    const updateObj: any = { ...restData };
    if (status !== undefined) updateObj.isActive = status === 'ACTIVE';

    const updated = await Branch.findByIdAndUpdate(branchId, { $set: updateObj }, { new: true });

    if (!updated) {
      throw new NotFoundError('Branch record not found.');
    }

    await logAudit({
      hospitalId: updated.hospitalId.toString(),
      branchId: updated._id.toString(),
      userId: req.user?.id,
      action: 'BRANCH_UPDATED',
      resource: 'branches',
      details: `Updated branch details for ${updated.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Branch details updated.',
      data: { branch: formatBranch(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = req.params.id as string;

    const branch = await Branch.findByIdAndUpdate(branchId, { $set: { isActive: false } }, { new: true });
    if (!branch) {
      throw new NotFoundError('Branch record not found.');
    }

    await logAudit({
      hospitalId: branch.hospitalId.toString(),
      branchId: branch._id.toString(),
      userId: req.user?.id,
      action: 'BRANCH_DEACTIVATED',
      resource: 'branches',
      details: `Deactivated branch ${branchId}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Branch deactivated successfully.',
    });
  } catch (err) {
    next(err);
  }
};
