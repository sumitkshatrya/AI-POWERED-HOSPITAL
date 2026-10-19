import { Request, Response, NextFunction } from 'express';
import { BloodDonor, BloodUnit, Patient } from '../models';
import { logAudit } from '../utils/audit';
import {
  createBloodDonorSchema,
  createBloodUnitSchema,
  updateBloodTestSchema,
  reserveBloodUnitSchema,
  issueBloodUnitSchema,
} from '../schemas/bloodBank.schema';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const getBloodBankDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const hospitalId = user?.hospitalId;
    const branchId = user?.branchId;

    const query: any = {};
    if (hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && user?.role !== 'SUPER_ADMIN') {
      query.$or = [{ branchId: String(branchId) }, { branchId: null }];
    }

    const allUnits = await BloodUnit.find(query).populate('donorId').sort({ expiryDate: 1 }).lean();

    const now = new Date();
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const bloodGroupStock: Record<string, number> = {};
    ALL_BLOOD_GROUPS.forEach((bg) => {
      bloodGroupStock[bg] = 0;
    });

    let totalAvailable = 0;
    let totalReserved = 0;
    let totalIssued = 0;
    let totalExpired = 0;
    let totalDiscarded = 0;
    let expiringSoonCount = 0;
    let pendingTestingCount = 0;

    allUnits.forEach((unit: any) => {
      const isExpired = new Date(unit.expiryDate) < now && unit.status !== 'ISSUED' && unit.status !== 'EXPIRED';

      if (unit.status === 'AVAILABLE') {
        if (isExpired) {
          totalExpired++;
        } else {
          bloodGroupStock[unit.bloodGroup] = (bloodGroupStock[unit.bloodGroup] || 0) + 1;
          totalAvailable++;
          if (new Date(unit.expiryDate) <= sevenDaysFromNow) {
            expiringSoonCount++;
          }
        }
      } else if (unit.status === 'RESERVED') {
        totalReserved++;
      } else if (unit.status === 'ISSUED') {
        totalIssued++;
      } else if (unit.status === 'EXPIRED') {
        totalExpired++;
      }
    });

    const totalDonors = await BloodDonor.countDocuments(query);

    const formattedUnits = allUnits.map((u: any) => ({
      ...u,
      id: String(u._id),
      donor: u.donorId ? { ...u.donorId, id: String(u.donorId._id) } : null,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalUnits: allUnits.length,
          totalAvailable,
          totalReserved,
          totalIssued,
          totalExpired,
          totalDiscarded,
          expiringSoonCount,
          pendingTestingCount,
          totalDonors,
          bloodGroupStock,
        },
        recentUnits: formattedUnits.slice(0, 15),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBloodUnits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const hospitalId = user?.hospitalId;
    const branchId = user?.branchId;
    const { bloodGroup, status, componentType, testingStatus, search } = req.query;

    const query: any = {};
    if (hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && user?.role !== 'SUPER_ADMIN') {
      query.$or = [{ branchId: String(branchId) }, { branchId: null }];
    }
    if (bloodGroup && bloodGroup !== 'ALL') {
      query.bloodGroup = String(bloodGroup);
    }
    if (status && status !== 'ALL') {
      query.status = String(status);
    }
    if (search) {
      const q = String(search);
      query.$or = [
        { unitNumber: { $regex: q, $options: 'i' } },
        { storageLocation: { $regex: q, $options: 'i' } },
      ];
    }

    const units = await BloodUnit.find(query).populate('donorId').sort({ expiryDate: 1 }).lean();

    const now = new Date();
    const formattedUnits = units.map((u: any) => ({
      ...u,
      id: String(u._id),
      donor: u.donorId ? { ...u.donorId, id: String(u.donorId._id) } : null,
      isExpired: new Date(u.expiryDate) < now && u.status !== 'ISSUED',
    }));

    res.status(200).json({
      status: 'success',
      data: formattedUnits,
    });
  } catch (error) {
    next(error);
  }
};

export const createBloodUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const validated = createBloodUnitSchema.parse(req.body);
    const hospitalId = user?.hospitalId;
    const effectiveBranchId = validated.branchId || user?.branchId;

    if (validated.donorId) {
      const donor = await BloodDonor.findById(validated.donorId);
      if (!donor) {
        res.status(404).json({ status: 'error', message: 'Donor not found' });
        return;
      }
    }

    const year = new Date().getFullYear();
    const count = await BloodUnit.countDocuments();
    const unitNumber = `BLD-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const unit = await BloodUnit.create({
      unitNumber,
      donorId: validated.donorId || undefined,
      hospitalId,
      bloodGroup: validated.bloodGroup,
      collectionDate: validated.collectionDate ? new Date(validated.collectionDate) : new Date(),
      expiryDate: new Date(validated.expiryDate),
      storageLocation: validated.storageLocation,
      status: 'AVAILABLE',
    });

    if (validated.donorId) {
      await BloodDonor.findByIdAndUpdate(validated.donorId, {
        lastDonatedDate: unit.collectionDate,
      });
    }

    await logAudit({
      hospitalId: hospitalId ? String(hospitalId) : undefined,
      branchId: effectiveBranchId ? String(effectiveBranchId) : undefined,
      userId: user?.id,
      action: 'DONATE_BLOOD',
      resource: `BloodUnit:${unit._id}`,
      details: `Collected blood unit #${unitNumber} (${unit.bloodGroup})`,
    });

    res.status(201).json({
      status: 'success',
      data: {
        ...unit.toObject(),
        id: String(unit._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBloodTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);
    const validated = updateBloodTestSchema.parse(req.body);

    const existing = await BloodUnit.findById(id);
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Blood unit not found' });
      return;
    }

    if (validated.testingStatus === 'FAILED') {
      existing.status = 'EXPIRED';
    }
    await existing.save();

    await logAudit({
      hospitalId: existing.hospitalId ? String(existing.hospitalId) : undefined,
      userId: user?.id,
      action: 'UPDATE_BLOOD_TEST',
      resource: `BloodUnit:${id}`,
      details: `Infection screening test result updated to ${validated.testingStatus} for unit #${existing.unitNumber}`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...existing.toObject(),
        id: String(existing._id),
        testingStatus: validated.testingStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const reserveBloodUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);
    const validated = reserveBloodUnitSchema.parse(req.body);

    const unit = await BloodUnit.findById(id);
    if (!unit) {
      res.status(404).json({ status: 'error', message: 'Blood unit not found' });
      return;
    }

    if (unit.status !== 'AVAILABLE') {
      res.status(400).json({
        status: 'error',
        message: `Blood unit #${unit.unitNumber} is not AVAILABLE (Status: ${unit.status})`,
      });
      return;
    }

    const patient = await Patient.findById(validated.patientId);
    if (!patient) {
      res.status(404).json({ status: 'error', message: 'Patient not found' });
      return;
    }

    unit.status = 'RESERVED';
    await unit.save();

    await logAudit({
      hospitalId: unit.hospitalId ? String(unit.hospitalId) : undefined,
      userId: user?.id,
      action: 'RESERVE_BLOOD',
      resource: `BloodUnit:${id}`,
      details: `Reserved blood unit #${unit.unitNumber} (${unit.bloodGroup}) for patient ${patient.firstName} ${patient.lastName}`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...unit.toObject(),
        id: String(unit._id),
        reservedForPatient: { id: String(patient._id), firstName: patient.firstName, lastName: patient.lastName, uhid: patient.uhid },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const issueBloodUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);
    const validated = issueBloodUnitSchema.parse(req.body);

    const unit = await BloodUnit.findById(id);
    if (!unit) {
      res.status(404).json({ status: 'error', message: 'Blood unit not found' });
      return;
    }

    if (unit.status !== 'AVAILABLE' && unit.status !== 'RESERVED') {
      res.status(400).json({
        status: 'error',
        message: `Blood unit #${unit.unitNumber} cannot be issued (Current status: ${unit.status})`,
      });
      return;
    }

    if (validated.crossmatchResult !== 'COMPATIBLE') {
      res.status(400).json({
        status: 'error',
        message: 'Cannot issue blood unit: Crossmatch compatibility result is INCOMPATIBLE. Patient safety violation.',
      });
      return;
    }

    const patient = await Patient.findById(validated.patientId);
    if (!patient) {
      res.status(404).json({ status: 'error', message: 'Recipient patient not found' });
      return;
    }

    unit.status = 'ISSUED';
    await unit.save();

    await logAudit({
      hospitalId: unit.hospitalId ? String(unit.hospitalId) : undefined,
      userId: user?.id,
      action: 'ISSUE_BLOOD',
      resource: `BloodUnit:${id}`,
      details: `Issued blood unit #${unit.unitNumber} (${unit.bloodGroup}) to patient ${patient.firstName} ${patient.lastName} after COMPATIBLE crossmatch`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...unit.toObject(),
        id: String(unit._id),
        issuedToPatient: { id: String(patient._id), firstName: patient.firstName, lastName: patient.lastName, uhid: patient.uhid },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBloodDonors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const hospitalId = user?.hospitalId;
    const branchId = user?.branchId;
    const { bloodGroup, search } = req.query;

    const query: any = {};
    if (hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && user?.role !== 'SUPER_ADMIN') {
      query.$or = [{ branchId: String(branchId) }, { branchId: null }];
    }
    if (bloodGroup && bloodGroup !== 'ALL') {
      query.bloodGroup = String(bloodGroup);
    }
    if (search) {
      const q = String(search);
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const donors = await BloodDonor.find(query).sort({ name: 1 }).lean();

    const formattedDonors = donors.map((d: any) => ({
      ...d,
      id: String(d._id),
      contactPhone: d.phone,
      donorNumber: `DNR-${String(d._id).slice(-6)}`,
      _count: { donations: 1 },
    }));

    res.status(200).json({
      status: 'success',
      data: formattedDonors,
    });
  } catch (error) {
    next(error);
  }
};

export const createBloodDonor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const validated = createBloodDonorSchema.parse(req.body);
    const hospitalId = user?.hospitalId;
    const effectiveBranchId = validated.branchId || user?.branchId;

    const donor = await BloodDonor.create({
      hospitalId,
      name: validated.name,
      gender: validated.gender,
      age: validated.age,
      bloodGroup: validated.bloodGroup as any,
      phone: validated.contactPhone,
      email: validated.email || undefined,
      address: validated.address || undefined,
    });

    const donorNumber = `DNR-${new Date().getFullYear()}-${String(donor._id).slice(-4)}`;

    await logAudit({
      hospitalId: hospitalId ? String(hospitalId) : undefined,
      branchId: effectiveBranchId ? String(effectiveBranchId) : undefined,
      userId: user?.id,
      action: 'REGISTER_BLOOD_DONOR',
      resource: `BloodDonor:${donor._id}`,
      details: `Registered new donor ${donor.name} (#${donorNumber}, Blood: ${donor.bloodGroup})`,
    });

    res.status(201).json({
      status: 'success',
      data: {
        ...donor.toObject(),
        id: String(donor._id),
        donorNumber,
        contactPhone: donor.phone,
        eligibilityStatus: 'ELIGIBLE',
      },
    });
  } catch (error) {
    next(error);
  }
};
