import { Request, Response, NextFunction } from 'express';
import { Department } from '../models';
import { createDepartmentSchema, updateDepartmentSchema } from '../schemas/department.schema';
import { logAudit } from '../utils/audit';
import { ConflictError, NotFoundError } from '../utils/errors';
import { safeJsonParseArray } from '../utils/json';

export const defaultDepartments = [
  { name: 'Cardiology', code: 'CARD', services: ['ECG', 'Echocardiogram', 'Angioplasty', 'Cardiac ICU'] },
  { name: 'Neurology', code: 'NEURO', services: ['EEG', 'EMG', 'Stroke Care', 'Brain MRI'] },
  { name: 'Orthopedics', code: 'ORTHO', services: ['Fracture Care', 'Joint Replacement', 'Arthroscopy'] },
  { name: 'Pediatrics', code: 'PED', services: ['Neonatal Care', 'Vaccination', 'Pediatric ICU'] },
  { name: 'Dermatology', code: 'DERM', services: ['Skin Biopsy', 'Laser Therapy', 'Cosmetics'] },
  { name: 'Gynecology', code: 'OBGYN', services: ['Maternity', 'Pap Smear', 'Ultrasound', 'Labor Ward'] },
  { name: 'ENT', code: 'ENT', services: ['Audiometry', 'Endoscopy', 'Tonsillectomy'] },
  { name: 'Dentistry', code: 'DENT', services: ['Root Canal', 'Implants', 'Orthodontics'] },
  { name: 'General Medicine', code: 'GENMED', services: ['OPD Consultations', 'Chronic Care', 'Health Checks'] },
  { name: 'General Surgery', code: 'GENSURG', services: ['Laparoscopy', 'Appendectomy', 'Hernia Repair'] },
  { name: 'Emergency', code: 'EMERG', services: ['Triage', 'Trauma Care', 'Resuscitation', 'Ambulance'] },
  { name: 'Radiology', code: 'RAD', services: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound'] },
  { name: 'Pathology', code: 'PATH', services: ['Blood Tests', 'Histopathology', 'Microbiology'] },
  { name: 'Oncology', code: 'ONCO', services: ['Chemotherapy', 'Radiation', 'Tumor Board'] },
];

const formatDepartment = (d: any) => {
  const branchObj: any = d.branchId && typeof d.branchId === 'object' ? d.branchId : null;
  const headDocObj: any = d.headDoctorId && typeof d.headDoctorId === 'object' ? d.headDoctorId : null;

  return {
    id: d._id ? d._id.toString() : d.id,
    _id: d._id,
    hospitalId: d.hospitalId?._id ? d.hospitalId._id.toString() : d.hospitalId?.toString() || null,
    branchId: branchObj ? branchObj._id.toString() : d.branchId?.toString() || null,
    name: d.name,
    code: d.code || d.name || '',
    description: d.description || null,
    headDoctorId: headDocObj ? headDocObj._id.toString() : d.headDoctorId?.toString() || null,
    headDoctor: headDocObj
      ? {
          id: headDocObj._id.toString(),
          firstName: headDocObj.firstName,
          lastName: headDocObj.lastName,
          email: headDocObj.email,
          phone: headDocObj.phone,
        }
      : null,
    branch: branchObj
      ? {
          id: branchObj._id.toString(),
          name: branchObj.name,
          code: branchObj.code || null,
        }
      : null,
    status: d.isActive !== false ? 'ACTIVE' : 'INACTIVE',
    isActive: d.isActive !== false,
    services: Array.isArray(d.services) ? d.services : safeJsonParseArray(d.services),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
};

export const seedDefaultDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { hospitalId, branchId } = req.body;

    if (!hospitalId || !branchId) {
      throw new ConflictError('hospitalId and branchId are required to seed default departments.');
    }

    const created: any[] = [];
    for (const dept of defaultDepartments) {
      const existing = await Department.findOne({ branchId, name: dept.name });

      if (!existing) {
        const d = await Department.create({
          hospitalId,
          branchId,
          name: dept.name,
          description: dept.services.join(', '),
          isActive: true,
        });
        created.push(d);
      }
    }

    res.status(201).json({
      status: 'success',
      message: `Seeded ${created.length} default clinical departments for branch.`,
      data: { createdCount: created.length },
    });
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createDepartmentSchema.parse(req.body);

    const hospitalId = data.hospitalId || req.user?.hospitalId;

    const existing = await Department.findOne({
      branchId: data.branchId,
      name: data.name,
    });

    if (existing) {
      throw new ConflictError(`Department '${data.name}' already exists in this branch.`);
    }

    const department = await Department.create({
      hospitalId,
      branchId: data.branchId,
      name: data.name,
      description: (data as any).description,
      headDoctorId: data.headDoctorId || undefined,
      isActive: data.status !== 'INACTIVE',
    });

    await logAudit({
      hospitalId: department.hospitalId.toString(),
      branchId: department.branchId?.toString(),
      userId: req.user?.id,
      action: 'DEPARTMENT_CREATED',
      resource: 'departments',
      details: `Created department ${department.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Department created.',
      data: {
        department: formatDepartment(department),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, hospitalId, search, status } = req.query;

    const query: any = {};

    if (branchId) {
      query.branchId = String(branchId);
    }
    if (hospitalId) {
      query.hospitalId = String(hospitalId);
    } else if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    if (status) {
      if (String(status) === 'ACTIVE') query.isActive = true;
      else if (String(status) === 'INACTIVE') query.isActive = false;
    }

    const departments = await Department.find(query)
      .populate('branchId')
      .populate('headDoctorId')
      .sort({ name: 1 });

    const formatted = departments.map(formatDepartment);

    res.status(200).json({
      status: 'success',
      data: { departments: formatted },
    });
  } catch (err) {
    next(err);
  }
};

export const getDepartmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departmentId = req.params.id as string;

    const department = await Department.findById(departmentId)
      .populate('branchId')
      .populate('headDoctorId');

    if (!department) {
      throw new NotFoundError('Department record not found.');
    }

    res.status(200).json({
      status: 'success',
      data: {
        department: formatDepartment(department),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departmentId = req.params.id as string;
    const data = updateDepartmentSchema.parse(req.body);

    const existing = await Department.findById(departmentId);
    if (!existing) {
      throw new NotFoundError('Department record not found.');
    }

    const { status, code, services, ...restData } = data;
    const updateObj: any = { ...restData };
    if (status !== undefined) updateObj.isActive = status === 'ACTIVE';

    const updated = await Department.findByIdAndUpdate(departmentId, { $set: updateObj }, { new: true })
      .populate('branchId')
      .populate('headDoctorId');

    if (!updated) {
      throw new NotFoundError('Department record not found.');
    }

    await logAudit({
      hospitalId: updated.hospitalId.toString(),
      branchId: updated.branchId?.toString(),
      userId: req.user?.id,
      action: 'DEPARTMENT_UPDATED',
      resource: 'departments',
      details: `Updated department ${updated.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Department updated successfully.',
      data: {
        department: formatDepartment(updated),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departmentId = req.params.id as string;

    const dept = await Department.findByIdAndUpdate(departmentId, { $set: { isActive: false } }, { new: true });
    if (!dept) {
      throw new NotFoundError('Department record not found.');
    }

    await logAudit({
      hospitalId: dept.hospitalId.toString(),
      branchId: dept.branchId?.toString(),
      userId: req.user?.id,
      action: 'DEPARTMENT_DEACTIVATED',
      resource: 'departments',
      details: `Deactivated department ${departmentId}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Department deactivated successfully.',
    });
  } catch (err) {
    next(err);
  }
};
