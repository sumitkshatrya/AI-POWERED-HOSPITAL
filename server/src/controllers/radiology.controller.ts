import { Request, Response, NextFunction } from 'express';
import { RadiologyOrder, Patient, Doctor, User } from '../models';
import {
  createRadiologyOrderSchema,
  scheduleRadiologyScanSchema,
  completeRadiologyScanSchema,
  draftRadiologyReportSchema,
  verifyRadiologyReportSchema,
} from '../schemas/radiology.schema';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { logAudit } from '../utils/audit';
import { Role } from '../types/roles';

export const createRadiologyOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createRadiologyOrderSchema.parse(req.body);

    const patient = await Patient.findById(data.patientId);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    const year = new Date().getFullYear();
    const count = await RadiologyOrder.countDocuments();
    const orderNumber = `RAD-${year}-${(count + 1).toString().padStart(4, '0')}`;
    const accessionNumber = `ACC-${year}-${(count + 1).toString().padStart(6, '0')}`;
    const studyInstanceUid = `1.2.840.113619.2.55.3.${Date.now()}.${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await RadiologyOrder.create({
      orderNumber,
      hospitalId: patient.hospitalId,
      branchId: patient.branchId,
      patientId: data.patientId,
      doctorId: data.doctorId || undefined,
      procedureName: data.bodyPart ? `${data.imagingType} ${data.bodyPart}` : data.imagingType,
      modality: data.imagingType,
      priority: data.urgency || 'ROUTINE',
      status: 'ORDERED',
    });

    const populatedOrder = await RadiologyOrder.findById(order._id)
      .populate('patientId', 'firstName lastName uhid mrn gender dateOfBirth')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } });

    await logAudit({
      hospitalId: patient.hospitalId?.toString(),
      branchId: patient.branchId?.toString(),
      userId: req.user?.id,
      action: 'RADIOLOGY_ORDER_CREATED',
      resource: 'radiology_orders',
      details: `Created ${data.imagingType} radiology order ${orderNumber} for patient ${patient.patientId || patient._id}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const rObj = populatedOrder ? (populatedOrder.toObject ? populatedOrder.toObject() : populatedOrder) : order;
    res.status(201).json({
      status: 'success',
      message: 'Radiology scan order created successfully.',
      data: {
        radiologyOrder: {
          ...rObj,
          patient: rObj.patientId,
          doctor: rObj.doctorId,
          accessionNumber,
          studyInstanceUid,
          pacsViewerUrl: `/dicom-viewer?studyUid=${studyInstanceUid}`,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const scheduleRadiologyScan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = scheduleRadiologyScanSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const order = await RadiologyOrder.findOne(query);
    if (!order) {
      throw new NotFoundError('Radiology order not found.');
    }

    order.status = 'SCHEDULED';
    await order.save();

    const updated = await RadiologyOrder.findById(id).populate('patientId');
    const uObj = updated ? (updated.toObject ? updated.toObject() : updated) : order;

    await logAudit({
      userId: req.user?.id,
      action: 'RADIOLOGY_SCAN_SCHEDULED',
      resource: 'radiology_orders',
      details: `Scheduled radiology scan ${order.orderNumber} for ${body.scheduledAt}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Radiology scan scheduled successfully.',
      data: {
        radiologyOrder: {
          ...uObj,
          patient: uObj.patientId,
          scheduledAt: body.scheduledAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const completeRadiologyScan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = completeRadiologyScanSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const order = await RadiologyOrder.findOne(query);
    if (!order) {
      throw new NotFoundError('Radiology order not found.');
    }

    order.status = 'SCAN_COMPLETED';
    await order.save();

    const updated = await RadiologyOrder.findById(id).populate('patientId');
    const uObj = updated ? (updated.toObject ? updated.toObject() : updated) : order;

    await logAudit({
      userId: req.user?.id,
      action: 'RADIOLOGY_SCAN_COMPLETED',
      resource: 'radiology_orders',
      details: `Completed scan for radiology order ${order.orderNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Radiology scan completed and DICOM study registered.',
      data: {
        radiologyOrder: {
          ...uObj,
          patient: uObj.patientId,
          pacsViewerUrl: body.pacsViewerUrl || `/dicom-viewer?studyUid=${uObj._id}`,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const draftRadiologyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = draftRadiologyReportSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const order = await RadiologyOrder.findOne(query);
    if (!order) {
      throw new NotFoundError('Radiology order not found.');
    }

    if (order.status === 'VERIFIED') {
      throw new ValidationError('Verified radiology report is locked. Contact Chief Radiologist for amendment.');
    }

    order.status = 'REPORT_DRAFTED';
    order.findings = body.findings;
    order.impression = body.impression || undefined;
    if (req.user?.id) {
      const doc = await Doctor.findOne({ userId: req.user.id });
      if (doc) order.radiologistId = doc._id;
    }
    await order.save();

    const updated = await RadiologyOrder.findById(id)
      .populate('patientId')
      .populate({ path: 'radiologistId', populate: { path: 'userId' } });

    const uObj = updated ? (updated.toObject ? updated.toObject() : updated) : order;

    await logAudit({
      userId: req.user?.id,
      action: 'RADIOLOGY_REPORT_FINALIZED',
      resource: 'radiology_orders',
      details: `Radiologist drafted report for Order ${order.orderNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Radiology findings & report drafted successfully.',
      data: {
        radiologyOrder: {
          ...uObj,
          patient: uObj.patientId,
          radiologist: uObj.radiologistId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyRadiologyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = verifyRadiologyReportSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const order = await RadiologyOrder.findOne(query);
    if (!order) {
      throw new NotFoundError('Radiology order not found.');
    }

    order.status = 'VERIFIED';
    await order.save();

    const updated = await RadiologyOrder.findById(id)
      .populate('patientId')
      .populate('radiologistId');

    const uObj = updated ? (updated.toObject ? updated.toObject() : updated) : order;

    await logAudit({
      userId: req.user?.id,
      action: 'RADIOLOGY_REPORT_VERIFIED',
      resource: 'radiology_orders',
      details: `Verified radiology report for Order ${order.orderNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Radiology report verified and finalized.',
      data: {
        radiologyOrder: {
          ...uObj,
          patient: uObj.patientId,
          radiologist: uObj.radiologistId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getRadiologyWorklist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { imagingType, status, urgency, patientId, search } = req.query;

    const query: any = {};

    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    // Patient Security Filter
    if (req.user?.role === Role.PATIENT) {
      const pat = await Patient.findOne({ userId: req.user.id });
      if (!pat) {
        res.status(200).json({ status: 'success', data: { radiologyOrders: [] } });
        return;
      }
      query.patientId = pat._id;
    } else if (patientId) {
      query.patientId = patientId as string;
    }

    if (imagingType) query.modality = imagingType as string;
    if (status) query.status = status as string;
    if (urgency) query.priority = urgency as string;
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { procedureName: searchRegex },
      ];
    }

    const rawOrders = await RadiologyOrder.find(query)
      .populate('patientId', 'firstName lastName uhid mrn gender dateOfBirth')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate('radiologistId')
      .sort({ createdAt: -1 });

    const orders = rawOrders.map((o: any) => {
      const oObj = o.toObject ? o.toObject() : o;
      return {
        ...oObj,
        patient: oObj.patientId,
        doctor: oObj.doctorId,
        radiologist: oObj.radiologistId,
        imagingType: oObj.modality,
        urgency: oObj.priority,
      };
    });

    res.status(200).json({
      status: 'success',
      data: { radiologyOrders: orders },
    });
  } catch (err) {
    next(err);
  }
};

export const getRadiologyOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const raw = await RadiologyOrder.findOne(query)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .populate('radiologistId');

    if (!raw) {
      throw new NotFoundError('Radiology order record not found.');
    }

    const rObj = raw.toObject ? raw.toObject() : raw;
    const patientObj = rObj.patientId as any;

    // Security Check: Patient can only view their own radiology order
    if (req.user?.role === Role.PATIENT && patientObj?.userId?.toString() !== req.user.id) {
      throw new ForbiddenError('You are not authorized to view this radiology scan report.');
    }

    const order = {
      ...rObj,
      patient: rObj.patientId,
      doctor: rObj.doctorId,
      radiologist: rObj.radiologistId,
      imagingType: rObj.modality,
      urgency: rObj.priority,
    };

    res.status(200).json({
      status: 'success',
      data: { radiologyOrder: order },
    });
  } catch (err) {
    next(err);
  }
};
