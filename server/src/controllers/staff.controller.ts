import { Request, Response, NextFunction } from 'express';
import { User, Hospital, Branch, Department } from '../models';
import { createStaffSchema, updateStaffSchema } from '../schemas/staff.schema';
import { hashPassword } from '../utils/passwords';
import { logAudit } from '../utils/audit';
import { ConflictError, NotFoundError } from '../utils/errors';
import { Role } from '../types/roles';

const formatStaff = (u: any) => {
  const userObj = u.toObject ? u.toObject() : u;
  const hospitalObj = userObj.hospitalId && typeof userObj.hospitalId === 'object' ? userObj.hospitalId : null;
  const branchObj = userObj.branchId && typeof userObj.branchId === 'object' ? userObj.branchId : null;
  const departmentObj = userObj.departmentId && typeof userObj.departmentId === 'object' ? userObj.departmentId : null;

  return {
    id: userObj._id ? userObj._id.toString() : userObj.id,
    _id: userObj._id,
    email: userObj.email,
    firstName: userObj.firstName,
    lastName: userObj.lastName,
    phone: userObj.phone,
    role: userObj.role,
    hospitalId: hospitalObj ? hospitalObj._id.toString() : (userObj.hospitalId ? userObj.hospitalId.toString() : null),
    branchId: branchObj ? branchObj._id.toString() : (userObj.branchId ? userObj.branchId.toString() : null),
    departmentId: departmentObj ? departmentObj._id.toString() : (userObj.departmentId ? userObj.departmentId.toString() : null),
    joiningDate: userObj.joiningDate || userObj.createdAt,
    profileImage: userObj.profileImage,
    specialization: userObj.specialization,
    licenseNumber: userObj.licenseNumber,
    status: userObj.isActive !== false ? (userObj.status || 'ACTIVE') : 'INACTIVE',
    isActive: userObj.isActive !== false,
    lastLoginAt: userObj.lastLogin || userObj.lastLoginAt,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt,
    hospital: hospitalObj ? { id: hospitalObj._id.toString(), name: hospitalObj.name, code: hospitalObj.registrationNumber || null } : null,
    branch: branchObj ? { id: branchObj._id.toString(), name: branchObj.name, code: branchObj.code || null } : null,
    department: departmentObj ? { id: departmentObj._id.toString(), name: departmentObj.name, code: departmentObj.code || null } : null,
  };
};

export const createStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createStaffSchema.parse(req.body);

    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new ConflictError('User account with this email already exists.');
    }

    const defaultPassword = data.password || 'Password123!';
    const passwordHash = await hashPassword(defaultPassword);

    const staff = await User.create({
      email: data.email.toLowerCase(),
      password: passwordHash,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? undefined,
      role: data.role as Role,
      hospitalId: data.hospitalId || req.user?.hospitalId || undefined,
      branchId: data.branchId || req.user?.branchId || undefined,
      departmentId: data.departmentId || undefined,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
      profileImage: data.profileImage ?? undefined,
      specialization: data.specialization ?? undefined,
      licenseNumber: data.licenseNumber ?? undefined,
      isActive: data.status ? data.status === 'ACTIVE' : true,
      isVerified: true,
    });

    const populated = await User.findById(staff._id)
      .populate('hospitalId', 'name registrationNumber')
      .populate('branchId', 'name code')
      .populate('departmentId', 'name code');

    await logAudit({
      hospitalId: staff.hospitalId ? staff.hospitalId.toString() : undefined,
      branchId: staff.branchId ? staff.branchId.toString() : undefined,
      userId: staff._id.toString(),
      action: 'STAFF_REGISTERED',
      resource: 'users',
      details: `Registered staff member ${staff.firstName} ${staff.lastName} with role ${staff.role}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Staff member account created.',
      data: { staff: formatStaff(populated || staff) },
    });
  } catch (err) {
    next(err);
  }
};

export const getStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { hospitalId, branchId, departmentId, role, status, search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (hospitalId) {
      query.hospitalId = String(hospitalId);
    } else if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    if (branchId) {
      query.branchId = String(branchId);
    }

    if (departmentId) {
      query.departmentId = String(departmentId);
    }

    if (role) {
      query.role = String(role);
    }

    if (status) {
      if (String(status) === 'ACTIVE') query.isActive = true;
      else if (String(status) === 'INACTIVE') query.isActive = false;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { specialization: searchRegex },
      ];
    }

    const [totalCount, rawStaff] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .populate('hospitalId', 'name registrationNumber')
        .populate('branchId', 'name code')
        .populate('departmentId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const formattedStaff = rawStaff.map(formatStaff);

    res.status(200).json({
      status: 'success',
      data: {
        staff: formattedStaff,
        meta: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getStaffById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffId = req.params.id as string;

    const staff = await User.findById(staffId)
      .populate('hospitalId', 'name registrationNumber')
      .populate('branchId', 'name code')
      .populate('departmentId', 'name code');

    if (!staff) {
      throw new NotFoundError('Staff member record not found.');
    }

    res.status(200).json({
      status: 'success',
      data: { staff: formatStaff(staff) },
    });
  } catch (err) {
    next(err);
  }
};

export const updateStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffId = req.params.id as string;
    const data = updateStaffSchema.parse(req.body);

    const existing = await User.findById(staffId);
    if (!existing) {
      throw new NotFoundError('Staff member record not found.');
    }

    const { status, joiningDate, ...restData } = data;
    const updateObj: any = { ...restData };
    if (status !== undefined) updateObj.isActive = status === 'ACTIVE';
    if (joiningDate) updateObj.joiningDate = new Date(joiningDate);

    const updated = await User.findByIdAndUpdate(staffId, { $set: updateObj }, { new: true })
      .populate('hospitalId', 'name registrationNumber')
      .populate('branchId', 'name code')
      .populate('departmentId', 'name code');

    if (!updated) {
      throw new NotFoundError('Staff member record not found.');
    }

    await logAudit({
      hospitalId: updated.hospitalId ? updated.hospitalId.toString() : undefined,
      branchId: updated.branchId ? updated.branchId.toString() : undefined,
      userId: req.user?.id,
      action: 'STAFF_UPDATED',
      resource: 'users',
      details: `Updated details for staff member ${updated.firstName} ${updated.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Staff details updated.',
      data: { staff: formatStaff(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const toggleStaffStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffId = req.params.id as string;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      throw new ConflictError('Invalid status value. Must be ACTIVE, INACTIVE, or SUSPENDED.');
    }

    const updated = await User.findByIdAndUpdate(
      staffId,
      { $set: { isActive: status === 'ACTIVE' } },
      { new: true }
    );

    if (!updated) {
      throw new NotFoundError('Staff member not found.');
    }

    res.status(200).json({
      status: 'success',
      message: `Staff account status changed to ${status}.`,
      data: { staff: formatStaff(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffId = req.params.id as string;

    await User.findByIdAndUpdate(staffId, { $set: { isActive: false } });

    res.status(200).json({
      status: 'success',
      message: 'Staff member account deactivated.',
    });
  } catch (err) {
    next(err);
  }
};

