import { Request, Response, NextFunction } from 'express';
import { LabTest } from '../models';
import { createLabCatalogItemSchema } from '../schemas/lab.schema';
import { NotFoundError, ConflictError } from '../utils/errors';

export const getLabCatalog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, search, status } = req.query;
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
        { code: searchRegex },
      ];
    }

    const catalog = await LabTest.find(query).sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      data: { catalog },
    });
  } catch (err) {
    next(err);
  }
};

export const createLabCatalogItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createLabCatalogItemSchema.parse(req.body);
    const hospitalId = req.user?.hospitalId || data.hospitalId;

    const existingQuery: any = { code: data.testCode };
    if (hospitalId) {
      existingQuery.hospitalId = hospitalId;
    }

    const existing = await LabTest.findOne(existingQuery);
    if (existing) {
      throw new ConflictError(`Test code '${data.testCode}' already exists in lab catalog.`);
    }

    const item = await LabTest.create({
      hospitalId,
      code: data.testCode,
      name: data.testName,
      category: data.category,
      price: data.price,
      testDetails: data.description || undefined,
      isActive: data.status === 'ACTIVE',
    });

    res.status(201).json({
      status: 'success',
      message: 'Lab test catalog item created successfully.',
      data: { catalogItem: item },
    });
  } catch (err) {
    next(err);
  }
};

export const updateLabCatalogItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await LabTest.findById(id);
    if (!existing) {
      throw new NotFoundError('Lab catalog item not found.');
    }

    const updateData: any = { ...req.body };
    if (req.body.testCode) updateData.code = req.body.testCode;
    if (req.body.testName) updateData.name = req.body.testName;
    if (req.body.status) updateData.isActive = req.body.status === 'ACTIVE';
    if (req.body.description) updateData.testDetails = req.body.description;

    const updated = await LabTest.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      status: 'success',
      message: 'Lab test catalog item updated successfully.',
      data: { catalogItem: updated },
    });
  } catch (err) {
    next(err);
  }
};
