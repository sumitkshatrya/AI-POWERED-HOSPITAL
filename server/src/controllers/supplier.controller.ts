import { Request, Response, NextFunction } from 'express';
import { Supplier } from '../models';
import { createSupplierSchema, updateSupplierSchema } from '../schemas/pharmacy.schema';
import { NotFoundError } from '../utils/errors';
import { logAudit } from '../utils/audit';

export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status } = req.query;
    const query: any = {};

    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    if (status) {
      if (status === 'ACTIVE' || status === 'INACTIVE') {
        query.isActive = status === 'ACTIVE';
      }
    }
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { contactPerson: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ];
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      data: { suppliers },
    });
  } catch (err) {
    next(err);
  }
};

export const getSupplierById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const query: any = { _id: id };
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const supplier = await Supplier.findOne(query);

    if (!supplier) {
      throw new NotFoundError('Supplier not found.');
    }

    res.status(200).json({
      status: 'success',
      data: { supplier },
    });
  } catch (err) {
    next(err);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createSupplierSchema.parse(req.body);
    const hospitalId = req.user?.hospitalId;

    const supplier = await Supplier.create({
      hospitalId,
      name: data.name,
      contactPerson: data.contactPerson || undefined,
      email: data.email || undefined,
      phone: data.phone,
      address: data.address || undefined,
      taxId: data.taxId || undefined,
      isActive: data.status === 'ACTIVE',
    });

    await logAudit({
      branchId: req.user?.branchId,
      userId: req.user?.id,
      action: 'SUPPLIER_CREATED',
      resource: 'suppliers',
      details: `Created supplier ${supplier.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Supplier created successfully.',
      data: { supplier },
    });
  } catch (err) {
    next(err);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updateSupplierSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const existing = await Supplier.findOne(query);
    if (!existing) {
      throw new NotFoundError('Supplier record not found.');
    }

    const updateData: any = { ...data };
    if (data.status) {
      updateData.isActive = data.status === 'ACTIVE';
    }

    const supplier = await Supplier.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      status: 'success',
      message: 'Supplier updated successfully.',
      data: { supplier },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const query: any = { _id: id };
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const existing = await Supplier.findOne(query);
    if (!existing) {
      throw new NotFoundError('Supplier not found.');
    }

    await Supplier.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Supplier deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
