import { Request, Response, NextFunction } from 'express';
import { Hospital } from '../models';
import { createHospitalSchema, updateHospitalSchema } from '../schemas/hospital.schema';
import { logAudit } from '../utils/audit';
import { ConflictError, NotFoundError } from '../utils/errors';

const parseFacilities = (fac: any): string[] => {
  if (!fac) return [];
  if (Array.isArray(fac)) return fac.map(String);
  if (typeof fac === 'string') {
    try {
      const parsed = JSON.parse(fac);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return fac.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const formatHospital = (h: any) => ({
  id: h._id ? h._id.toString() : h.id,
  _id: h._id,
  name: h.name,
  code: h.registrationNumber || h.code || '',
  registrationNumber: h.registrationNumber || h.code || '',
  logoUrl: h.logo || h.logoUrl || null,
  contactEmail: h.email || h.contactEmail || '',
  contactPhone: h.phone || h.contactPhone || '',
  email: h.email || h.contactEmail || '',
  phone: h.phone || h.contactPhone || '',
  address: h.address,
  website: h.website || null,
  emergencyContact: h.emergencyContact || null,
  workingHours: h.workingHours || null,
  facilities: parseFacilities(h.facilities),
  taxId: h.taxId || null,
  status: h.isActive !== false ? 'ACTIVE' : 'INACTIVE',
  isActive: h.isActive !== false,
  createdAt: h.createdAt,
  updatedAt: h.updatedAt,
});

export const createHospital = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createHospitalSchema.parse(req.body);

    if (data.code) {
      const existing = await Hospital.findOne({ registrationNumber: data.code });
      if (existing) {
        throw new ConflictError(`Hospital with code '${data.code}' already exists.`);
      }
    }

    const userFac = req.body.facilities || data.facilities;
    let facilitiesList: string[] = ['Emergency', 'ICU', 'Radiology', 'Pharmacy', 'Laboratory'];
    if (userFac) {
      facilitiesList = parseFacilities(userFac);
      if (facilitiesList.length === 0) {
        facilitiesList = ['Emergency', 'ICU', 'Radiology', 'Pharmacy', 'Laboratory'];
      }
    }

    const hospital = await Hospital.create({
      name: data.name,
      registrationNumber: data.code,
      logo: data.logoUrl,
      email: data.contactEmail,
      phone: data.contactPhone,
      address: data.address,
      website: data.website,
      emergencyContact: data.emergencyContact,
      workingHours: data.workingHours,
      facilities: facilitiesList,
      isActive: data.status !== 'INACTIVE',
    });

    await logAudit({
      hospitalId: hospital._id.toString(),
      userId: req.user?.id,
      action: 'HOSPITAL_CREATED',
      resource: 'hospitals',
      details: `Created hospital ${hospital.name} (${data.code || ''})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Hospital onboarding completed.',
      data: {
        hospital: formatHospital(hospital),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getHospitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status } = req.query;

    const query: any = {};

    // Multi-tenant check: Non-SuperAdmin only see their assigned hospital
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hospitalId) {
      query._id = req.user.hospitalId;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { name: searchRegex },
        { registrationNumber: searchRegex },
        { email: searchRegex },
      ];
    }

    if (status) {
      if (String(status) === 'ACTIVE') query.isActive = true;
      else if (String(status) === 'INACTIVE') query.isActive = false;
    }

    const hospitals = await Hospital.find(query).sort({ createdAt: -1 });

    const formatted = hospitals.map(formatHospital);

    res.status(200).json({
      status: 'success',
      data: { hospitals: formatted },
    });
  } catch (err) {
    next(err);
  }
};

export const getHospitalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hospitalId = req.params.id as string;

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      throw new NotFoundError('Hospital record not found.');
    }

    res.status(200).json({
      status: 'success',
      data: {
        hospital: formatHospital(hospital),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateHospital = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hospitalId = req.params.id as string;
    const data = updateHospitalSchema.parse(req.body);

    const existing = await Hospital.findById(hospitalId);
    if (!existing) {
      throw new NotFoundError('Hospital record not found.');
    }

    const { facilities, code, logoUrl, contactEmail, contactPhone, status, ...restData } = data;

    const updateObj: any = { ...restData };
    if (code !== undefined) updateObj.registrationNumber = code;
    if (logoUrl !== undefined) updateObj.logo = logoUrl;
    if (contactEmail !== undefined) updateObj.email = contactEmail;
    if (contactPhone !== undefined) updateObj.phone = contactPhone;
    if (status !== undefined) updateObj.isActive = status === 'ACTIVE';
    if (facilities !== undefined) updateObj.facilities = parseFacilities(facilities);

    const updated = await Hospital.findByIdAndUpdate(hospitalId, { $set: updateObj }, { new: true });

    if (!updated) {
      throw new NotFoundError('Hospital record not found.');
    }

    await logAudit({
      hospitalId: hospitalId,
      userId: req.user?.id,
      action: 'HOSPITAL_UPDATED',
      resource: 'hospitals',
      details: `Updated hospital details for ${updated.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Hospital details updated.',
      data: {
        hospital: formatHospital(updated),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteHospital = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hospitalId = req.params.id as string;

    const updated = await Hospital.findByIdAndUpdate(hospitalId, { $set: { isActive: false } });
    if (!updated) {
      throw new NotFoundError('Hospital record not found.');
    }

    await logAudit({
      hospitalId,
      userId: req.user?.id,
      action: 'HOSPITAL_DEACTIVATED',
      resource: 'hospitals',
      details: `Deactivated hospital ${hospitalId}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Hospital deactivated successfully.',
    });
  } catch (err) {
    next(err);
  }
};
