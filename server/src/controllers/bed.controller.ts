import { Request, Response, NextFunction } from 'express';
import { Bed, Ward, Room, Admission, Patient, Doctor } from '../models';
import { logAudit } from '../utils/audit';

export const getWards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const hospitalId = user?.hospitalId;
    const branchId = user?.branchId;

    const query: any = {};
    if (hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && user?.role !== 'SUPER_ADMIN') {
      query.$or = [{ branchId }, { branchId: { $exists: false } }, { branchId: null }];
    }

    const wards = await Ward.find(query).sort({ name: 1 }).lean();

    const wardIds = wards.map((w: any) => w._id);
    const beds = await Bed.find({ wardId: { $in: wardIds } }).lean();

    const formatted = wards.map((w: any) => {
      const wardBeds = beds.filter((b: any) => String(b.wardId) === String(w._id));
      const total = wardBeds.length;
      const available = wardBeds.filter((b: any) => b.status === 'AVAILABLE').length;
      const occupied = wardBeds.filter((b: any) => b.status === 'OCCUPIED').length;
      const cleaning = wardBeds.filter((b: any) => b.status === 'CLEANING').length;
      const maintenance = wardBeds.filter((b: any) => b.status === 'MAINTENANCE').length;
      const reserved = wardBeds.filter((b: any) => b.status === 'RESERVED').length;

      return {
        ...w,
        id: String(w._id),
        beds: wardBeds.map((b: any) => ({
          ...b,
          id: String(b._id),
          dailyRate: b.ratePerDay ?? (b as any).dailyRate,
        })),
        bedStats: {
          total,
          available,
          occupied,
          cleaning,
          maintenance,
          reserved,
        },
      };
    });

    res.status(200).json({
      status: 'success',
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const createWard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const { name, code, category, floor, totalBeds, dailyRate, description, branchId } = req.body;
    const hospitalId = user?.hospitalId;
    const effectiveBranchId = branchId || user?.branchId;

    const existing = await Ward.findOne({ code, hospitalId });
    if (existing) {
      res.status(400).json({ status: 'error', message: `Ward code '${code}' already exists` });
      return;
    }

    const ward = await Ward.create({
      hospitalId,
      branchId: effectiveBranchId,
      name,
      code,
      type: category || 'GENERAL',
      gender: floor || '1st Floor',
      totalBeds: totalBeds || 10,
    });

    const bedCount = totalBeds || 10;
    const bedPrefix = code.replace(/^WARD-/, '');
    const bedPromises: Promise<any>[] = [];
    for (let i = 1; i <= Math.min(bedCount, 20); i++) {
      const bNum = `${bedPrefix}-${String(i).padStart(2, '0')}`;
      bedPromises.push(
        Bed.create({
          hospitalId,
          branchId: effectiveBranchId,
          wardId: ward._id,
          bedNumber: bNum,
          ratePerDay: dailyRate || 100,
          status: 'AVAILABLE',
        })
      );
    }
    await Promise.all(bedPromises);

    await logAudit({
      hospitalId: hospitalId ? String(hospitalId) : undefined,
      branchId: effectiveBranchId ? String(effectiveBranchId) : undefined,
      userId: user?.id,
      action: 'CREATE_WARD',
      resource: `Ward:${ward._id}`,
      details: `Created ward ${ward.name} with ${bedCount} beds`,
    });

    res.status(201).json({
      status: 'success',
      data: {
        ...ward.toObject(),
        id: String(ward._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBedsMatrix = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const hospitalId = user?.hospitalId;
    const branchId = user?.branchId;
    const { category, status, wardId } = req.query;

    const query: any = {};
    if (hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && user?.role !== 'SUPER_ADMIN') {
      query.$or = [{ branchId: String(branchId) }, { branchId: null }];
    }
    if (status) {
      query.status = String(status);
    }
    if (wardId) {
      query.wardId = String(wardId);
    }

    const rawBeds = await Bed.find(query).populate('wardId').lean();

    const activeAdmissions = await Admission.find({
      ...(hospitalId && user?.role !== 'SUPER_ADMIN' ? { hospitalId } : {}),
      status: 'ADMITTED',
    })
      .populate('patientId', 'uhid firstName lastName gender')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .lean();

    const beds = rawBeds.map((b: any) => {
      const ward = b.wardId || {};
      const admission = activeAdmissions.find((a: any) => String(a.bedId) === String(b._id));
      const admissions = admission
        ? [
            {
              id: String(admission._id),
              admissionNumber: admission.admissionNumber,
              admissionDate: admission.admissionDate,
              patient: admission.patientId
                ? {
                    id: String((admission.patientId as any)._id),
                    uhid: (admission.patientId as any).uhid,
                    firstName: (admission.patientId as any).firstName,
                    lastName: (admission.patientId as any).lastName,
                    gender: (admission.patientId as any).gender,
                  }
                : null,
              doctor: admission.doctorId
                ? {
                    id: String((admission.doctorId as any)._id),
                    user: (admission.doctorId as any).userId,
                  }
                : null,
            },
          ]
        : [];

      return {
        ...b,
        id: String(b._id),
        dailyRate: b.ratePerDay ?? b.dailyRate,
        ward: {
          id: String(ward._id || b.wardId),
          name: ward.name,
          code: ward.code,
          floor: ward.gender || ward.floor,
        },
        admissions,
      };
    });

    const totalBeds = beds.length;
    const availableBeds = beds.filter((b) => b.status === 'AVAILABLE').length;
    const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED').length;
    const cleaningBeds = beds.filter((b) => b.status === 'CLEANING').length;
    const maintenanceBeds = beds.filter((b) => b.status === 'MAINTENANCE').length;
    const reservedBeds = beds.filter((b) => b.status === 'RESERVED').length;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalBeds,
          availableBeds,
          occupiedBeds,
          cleaningBeds,
          maintenanceBeds,
          reservedBeds,
          occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        },
        beds,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createBed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const { wardId, bedNumber, roomNumber, category, dailyRate, features } = req.body;
    const hospitalId = user?.hospitalId;
    const branchId = user?.branchId;

    const ward = await Ward.findById(wardId);
    if (!ward) {
      res.status(404).json({ status: 'error', message: 'Ward not found' });
      return;
    }

    const existingBed = await Bed.findOne({ wardId, bedNumber });
    if (existingBed) {
      res.status(400).json({ status: 'error', message: `Bed ${bedNumber} already exists in ward ${ward.name}` });
      return;
    }

    const bed = await Bed.create({
      hospitalId: ward.hospitalId || hospitalId,
      branchId: ward.branchId || branchId,
      wardId,
      bedNumber,
      ratePerDay: dailyRate || 0,
      status: 'AVAILABLE',
    });

    res.status(201).json({
      status: 'success',
      data: {
        ...bed.toObject(),
        id: String(bed._id),
        dailyRate: bed.ratePerDay,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBedStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);
    const { status } = req.body;

    const bed = await Bed.findById(id);

    if (!bed) {
      res.status(404).json({ status: 'error', message: 'Bed not found' });
      return;
    }

    if (status === 'AVAILABLE') {
      const activeAdmission = await Admission.findOne({ bedId: id, status: 'ADMITTED' });
      if (activeAdmission) {
        res.status(400).json({
          status: 'error',
          message: 'Cannot mark bed as AVAILABLE while patient is currently admitted to this bed. Discharge or transfer the patient first.',
        });
        return;
      }
    }

    bed.status = status;
    await bed.save();

    await logAudit({
      hospitalId: bed.hospitalId ? String(bed.hospitalId) : undefined,
      branchId: bed.branchId ? String(bed.branchId) : undefined,
      userId: user?.id,
      action: 'UPDATE_BED_STATUS',
      resource: `Bed:${bed._id}`,
      details: `Bed ${bed.bedNumber} status updated to ${status}`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...bed.toObject(),
        id: String(bed._id),
      },
    });
  } catch (error) {
    next(error);
  }
};
