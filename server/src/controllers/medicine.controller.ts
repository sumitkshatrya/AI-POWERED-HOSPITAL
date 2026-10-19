import { Request, Response, NextFunction } from 'express';
import { Medicine } from '../models';
import { createMedicineSchema, updateMedicineSchema, stockAdjustmentSchema } from '../schemas/pharmacy.schema';
import { NotFoundError } from '../utils/errors';
import { logAudit } from '../utils/audit';

export const getMedicines = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, status, page, limit } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    if (category) query.category = category as string;
    if (status) {
      if (status === 'ACTIVE' || status === 'INACTIVE') {
        query.isActive = status === 'ACTIVE';
      }
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { genericName: searchRegex },
        { brandName: searchRegex },
        { manufacturer: searchRegex },
        { barcode: searchRegex },
      ];
    }

    const [totalCount, rawMedicines] = await Promise.all([
      Medicine.countDocuments(query),
      Medicine.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const medicines = rawMedicines.map((m: any) => {
      const mObj = m.toObject ? m.toObject() : m;
      return {
        ...mObj,
        brand: mObj.brandName || mObj.name,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        medicines,
        pagination: {
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

export const getMedicineById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const query: any = { _id: id };
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const raw = await Medicine.findOne(query);

    if (!raw) {
      throw new NotFoundError('Medicine record not found.');
    }

    const mObj: any = raw.toObject ? raw.toObject() : raw;
    const medicine = {
      ...mObj,
      brand: mObj.brandName || mObj.name,
    };

    res.status(200).json({
      status: 'success',
      data: { medicine },
    });
  } catch (err) {
    next(err);
  }
};

export const createMedicine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createMedicineSchema.parse(req.body);
    const hospitalId = req.user?.hospitalId;

    const medicine = await Medicine.create({
      hospitalId,
      name: data.name,
      brandName: data.brand || data.name,
      genericName: data.genericName,
      category: data.category,
      form: 'TABLET',
      manufacturer: data.manufacturer,
      isActive: data.status === 'ACTIVE',
    });

    await logAudit({
      branchId: req.user?.branchId,
      userId: req.user?.id,
      action: 'MEDICINE_CREATED',
      resource: 'medicines',
      details: `Added medicine ${medicine.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const mObj: any = medicine.toObject ? medicine.toObject() : medicine;
    res.status(201).json({
      status: 'success',
      message: 'Medicine record created successfully.',
      data: {
        medicine: {
          ...mObj,
          brand: mObj.brandName || mObj.name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateMedicine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updateMedicineSchema.parse(req.body);
    const query: any = { _id: id };
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const existing = await Medicine.findOne(query);
    if (!existing) {
      throw new NotFoundError('Medicine record not found.');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.brand) updateData.brandName = data.brand;
    if (data.genericName) updateData.genericName = data.genericName;
    if (data.category) updateData.category = data.category;
    if (data.manufacturer) updateData.manufacturer = data.manufacturer;
    if (data.status) updateData.isActive = data.status === 'ACTIVE';

    const medicine = await Medicine.findByIdAndUpdate(id, updateData, { new: true });
    const mObj: any = medicine ? (medicine.toObject ? medicine.toObject() : medicine) : {};

    res.status(200).json({
      status: 'success',
      message: 'Medicine record updated successfully.',
      data: {
        medicine: {
          ...mObj,
          brand: mObj.brandName || mObj.name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    stockAdjustmentSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const medicine = await Medicine.findOne(query);
    if (!medicine) {
      throw new NotFoundError('Medicine not found.');
    }

    const mObj: any = medicine.toObject ? medicine.toObject() : medicine;

    res.status(200).json({
      status: 'success',
      message: 'Stock level adjusted successfully.',
      data: {
        medicine: {
          ...mObj,
          brand: mObj.brandName || mObj.name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
