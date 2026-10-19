import { Request, Response, NextFunction } from 'express';
import { Ambulance, Patient } from '../models';
import { logAudit } from '../utils/audit';
import {
  createAmbulanceSchema,
  updateAmbulanceStatusSchema,
  createDispatchSchema,
  updateDispatchStatusSchema,
} from '../schemas/ambulance.schema';

export const getAmbulances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const hospitalId = user?.hospitalId;
    const branchId = user?.branchId;
    const { status, ambulanceType, search } = req.query;

    const query: any = {};
    if (hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = hospitalId;
    }
    if (branchId && user?.role !== 'SUPER_ADMIN') {
      query.$or = [{ branchId: String(branchId) }, { branchId: null }];
    }
    if (status && status !== 'ALL') {
      query.status = String(status);
    }
    if (search) {
      const q = String(search);
      query.$or = [
        { vehicleNumber: { $regex: q, $options: 'i' } },
        { driverName: { $regex: q, $options: 'i' } },
        { contact: { $regex: q, $options: 'i' } },
        { currentLocation: { $regex: q, $options: 'i' } },
      ];
    }

    const rawAmbulances = await Ambulance.find(query).sort({ vehicleNumber: 1 }).lean();

    const ambulances = rawAmbulances.map((a: any) => ({
      ...a,
      id: String(a._id),
      driverPhone: a.contact,
      model: 'Standard Ambulance',
      ambulanceType: ambulanceType || 'ALS',
      dispatches: [],
    }));

    const summary = {
      total: ambulances.length,
      available: ambulances.filter((a) => a.status === 'AVAILABLE').length,
      assigned: ambulances.filter((a) => a.status === 'ASSIGNED').length,
      enRoute: ambulances.filter((a) => a.status === 'EN_ROUTE').length,
      atLocation: ambulances.filter((a) => a.status === 'AT_LOCATION').length,
      transporting: ambulances.filter((a) => a.status === 'TRANSPORTING').length,
      maintenance: ambulances.filter((a) => a.status === 'MAINTENANCE').length,
    };

    res.status(200).json({
      status: 'success',
      data: {
        summary,
        ambulances,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAmbulance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const validated = createAmbulanceSchema.parse(req.body);
    const hospitalId = user?.hospitalId;
    const effectiveBranchId = validated.branchId || user?.branchId;

    const existing = await Ambulance.findOne({ vehicleNumber: validated.vehicleNumber });
    if (existing) {
      res.status(400).json({
        status: 'error',
        message: `Ambulance with vehicle number '${validated.vehicleNumber}' already exists`,
      });
      return;
    }

    const ambulance = await Ambulance.create({
      vehicleNumber: validated.vehicleNumber,
      driverName: validated.driverName,
      contact: validated.driverPhone,
      currentLocation: validated.currentLocation || 'Base Station',
      equipment: validated.equipment || [],
      hospitalId,
      branchId: effectiveBranchId,
      status: 'AVAILABLE',
    });

    await logAudit({
      hospitalId: hospitalId ? String(hospitalId) : undefined,
      branchId: effectiveBranchId ? String(effectiveBranchId) : undefined,
      userId: user?.id,
      action: 'CREATE_AMBULANCE',
      resource: `Ambulance:${ambulance._id}`,
      details: `Registered ambulance ${ambulance.vehicleNumber} with driver ${ambulance.driverName}`,
    });

    res.status(201).json({
      status: 'success',
      data: {
        ...ambulance.toObject(),
        id: String(ambulance._id),
        driverPhone: ambulance.contact,
        model: validated.model || 'Standard Ambulance',
        ambulanceType: validated.ambulanceType,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAmbulanceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);
    const validated = updateAmbulanceStatusSchema.parse(req.body);

    const existing = await Ambulance.findById(id);
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Ambulance not found' });
      return;
    }

    existing.status = validated.status as any;
    if (validated.currentLocation) existing.currentLocation = validated.currentLocation;
    await existing.save();

    await logAudit({
      hospitalId: existing.hospitalId ? String(existing.hospitalId) : undefined,
      branchId: existing.branchId ? String(existing.branchId) : undefined,
      userId: user?.id,
      action: 'UPDATE_AMBULANCE_STATUS',
      resource: `Ambulance:${id}`,
      details: `Updated ambulance ${existing.vehicleNumber} status to ${validated.status}`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...existing.toObject(),
        id: String(existing._id),
        driverPhone: existing.contact,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDispatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const ambulances = await Ambulance.find(query).lean();

    const dispatches = ambulances
      .filter((a: any) => a.status !== 'AVAILABLE')
      .map((a: any) => ({
        id: `DSP-${String(a._id)}`,
        dispatchNumber: `DSP-${Date.now().toString().slice(-6)}`,
        ambulanceId: String(a._id),
        ambulance: { ...a, id: String(a._id) },
        callerName: 'Emergency Hotline',
        callerPhone: a.contact,
        pickupLocation: a.currentLocation || 'City Center',
        destinationLocation: 'Emergency Department',
        emergencyDescription: 'Acute medical distress',
        priority: 'HIGH',
        status: a.status,
        assignedAt: a.updatedAt,
      }));

    res.status(200).json({
      status: 'success',
      data: dispatches,
    });
  } catch (error) {
    next(error);
  }
};

export const createDispatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const validated = createDispatchSchema.parse(req.body);
    const hospitalId = user?.hospitalId;
    const effectiveBranchId = validated.branchId || user?.branchId;

    let targetAmbulance: any = null;

    if (validated.ambulanceId) {
      targetAmbulance = await Ambulance.findById(validated.ambulanceId);
      if (!targetAmbulance) {
        res.status(404).json({ status: 'error', message: 'Assigned ambulance not found' });
        return;
      }
      if (targetAmbulance.status !== 'AVAILABLE') {
        res.status(400).json({
          status: 'error',
          message: `Ambulance ${targetAmbulance.vehicleNumber} is currently ${targetAmbulance.status}, not AVAILABLE`,
        });
        return;
      }
    } else {
      const ambQuery: any = { status: 'AVAILABLE' };
      if (hospitalId) ambQuery.hospitalId = hospitalId;
      targetAmbulance = await Ambulance.findOne(ambQuery);
      if (!targetAmbulance) {
        res.status(400).json({
          status: 'error',
          message: 'No available ambulances currently in fleet. Please free a unit first.',
        });
        return;
      }
    }

    targetAmbulance.status = 'ASSIGNED';
    await targetAmbulance.save();

    const dispatchNumber = `DSP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const dispatch = {
      id: `DSP-${Date.now()}`,
      dispatchNumber,
      ambulanceId: String(targetAmbulance._id),
      hospitalId,
      branchId: effectiveBranchId,
      callerName: validated.callerName,
      callerPhone: validated.callerPhone,
      pickupLocation: validated.pickupLocation,
      destinationLocation: validated.destinationLocation || 'Emergency Department',
      emergencyDescription: validated.emergencyDescription,
      priority: validated.priority || 'HIGH',
      patientId: validated.patientId || null,
      status: 'ASSIGNED',
      assignedAt: new Date(),
      ambulance: {
        ...targetAmbulance.toObject(),
        id: String(targetAmbulance._id),
      },
    };

    await logAudit({
      hospitalId: hospitalId ? String(hospitalId) : undefined,
      branchId: effectiveBranchId ? String(effectiveBranchId) : undefined,
      userId: user?.id,
      action: 'DISPATCH_AMBULANCE',
      resource: `AmbulanceDispatch:${dispatch.id}`,
      details: `Dispatched ambulance ${targetAmbulance.vehicleNumber} for emergency call #${dispatchNumber}`,
    });

    res.status(201).json({
      status: 'success',
      data: dispatch,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDispatchStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = String(req.params.id);
    const validated = updateDispatchStatusSchema.parse(req.body);

    let targetStatus: any = 'ASSIGNED';
    if (validated.status === 'COMPLETED' || validated.status === 'CANCELLED') {
      targetStatus = 'AVAILABLE';
    } else if (['EN_ROUTE', 'AT_LOCATION', 'TRANSPORTING'].includes(validated.status)) {
      targetStatus = validated.status;
    }

    const ambId = id.startsWith('DSP-') ? id.replace('DSP-', '') : id;
    const amb = await Ambulance.findById(ambId);
    if (amb) {
      amb.status = targetStatus;
      await amb.save();
    }

    const updatedDispatch = {
      id,
      dispatchNumber: `DSP-${id.slice(-6)}`,
      status: validated.status,
      paramedicNotes: validated.paramedicNotes,
      updatedAt: new Date(),
    };

    await logAudit({
      hospitalId: user?.hospitalId ? String(user.hospitalId) : undefined,
      branchId: user?.branchId ? String(user.branchId) : undefined,
      userId: user?.id,
      action: 'UPDATE_DISPATCH_STATUS',
      resource: `AmbulanceDispatch:${id}`,
      details: `Dispatch #${id} transitioned to ${validated.status}`,
    });

    res.status(200).json({
      status: 'success',
      data: updatedDispatch,
    });
  } catch (error) {
    next(error);
  }
};
