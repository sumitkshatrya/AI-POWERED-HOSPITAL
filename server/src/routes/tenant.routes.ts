import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '../types/roles';
import { Hospital, Branch } from '../models';
import { requireAuth, requireRole, requireHospitalAccess, requireBranchAccess } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.use(requireAuth);

// Create Hospital Network (SUPER_ADMIN only)
router.post('/hospitals', requireRole(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, logo, registrationNumber, email, phone, website, address, emergencyContact, workingHours, facilities } = req.body;
    const hospital = await Hospital.create({
      name,
      logo,
      registrationNumber,
      email: email || 'admin@hospital.com',
      phone: phone || '1234567890',
      website,
      address: address || 'Main St',
      emergencyContact,
      workingHours,
      facilities: facilities || [],
    });
    res.status(201).json({ status: 'success', data: { hospital } });
  } catch (err) {
    next(err);
  }
});

// List Hospitals (SUPER_ADMIN only)
router.get('/hospitals', requireRole(Role.SUPER_ADMIN), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await Hospital.find().lean().exec();
    res.status(200).json({ status: 'success', data: { hospitals } });
  } catch (err) {
    next(err);
  }
});

// Create Branch under Hospital
router.post(
  '/hospitals/:hospitalId/branches',
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN),
  requireHospitalAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.params.hospitalId as string;
      const { name, address, phone, email, workingHours } = req.body;

      const branch = await Branch.create({
        hospitalId,
        name,
        address: address || 'Branch Address',
        phone: phone || '1234567890',
        email: email || 'branch@hospital.com',
        workingHours,
      });

      res.status(201).json({ status: 'success', data: { branch } });
    } catch (err) {
      next(err);
    }
  }
);

// Get Branches for a Hospital (Isolated per tenant)
router.get(
  '/hospitals/:hospitalId/branches',
  requireHospitalAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.params.hospitalId as string;
      const branches = await Branch.find({ hospitalId }).lean().exec();
      res.status(200).json({ status: 'success', data: { branches } });
    } catch (err) {
      next(err);
    }
  }
);

// Protected Test Route to verify Tenant Isolation
router.get(
  '/hospitals/:hospitalId/branches/:branchId/protected-data',
  requireHospitalAccess(),
  requireBranchAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.params.hospitalId as string;
      const branchId = req.params.branchId as string;
      const branch = await Branch.findOne({ _id: branchId, hospitalId }).lean().exec();

      if (!branch) {
        throw new NotFoundError('Branch not found under specified hospital.');
      }

      res.status(200).json({
        status: 'success',
        message: 'Tenant access granted. Confirmed isolated backend data.',
        data: {
          accessedBy: req.user,
          hospitalId,
          branchId,
          branchName: branch.name,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
