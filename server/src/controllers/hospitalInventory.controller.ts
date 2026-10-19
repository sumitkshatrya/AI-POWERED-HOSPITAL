import { Request, Response, NextFunction } from 'express';
import { Inventory, Medicine, Supplier } from '../models';
import {
  createHospitalInventoryItemSchema,
  updateHospitalInventoryItemSchema,
  consumeInventoryItemSchema,
} from '../schemas/pharmacy.schema';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logAudit } from '../utils/audit';

export const getInventoryItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, status, lowStock, page, limit } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { batchNumber: searchRegex },
        { location: searchRegex },
      ];
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    const [totalCount, rawItems] = await Promise.all([
      Inventory.countDocuments(query),
      Inventory.find(query)
        .populate('medicineId')
        .populate('supplierId', 'id name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const items = rawItems.map((item: any) => {
      const itemObj: any = item.toObject ? item.toObject() : item;
      const med: any = itemObj.medicineId || {};
      return {
        ...itemObj,
        name: med.name || 'Inventory Item',
        itemCode: med.barcode || itemObj.batchNumber || 'INV-ITEM',
        category: med.category || category || 'GENERAL',
        supplier: itemObj.supplierId,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        items,
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

export const getInventoryItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const query: any = { _id: id };
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const raw = await Inventory.findOne(query)
      .populate('medicineId')
      .populate('supplierId');

    if (!raw) {
      throw new NotFoundError('Hospital inventory item not found.');
    }

    const itemObj: any = raw.toObject ? raw.toObject() : raw;
    const med: any = itemObj.medicineId || {};
    const item = {
      ...itemObj,
      name: med.name || 'Inventory Item',
      itemCode: med.barcode || itemObj.batchNumber || 'INV-ITEM',
      category: med.category || 'GENERAL',
      supplier: itemObj.supplierId,
    };

    res.status(200).json({
      status: 'success',
      data: { item },
    });
  } catch (err) {
    next(err);
  }
};

export const createInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createHospitalInventoryItemSchema.parse(req.body);
    const hospitalId = req.user?.hospitalId;

    const d = data as any;

    let medicine;
    if (d.medicineId) {
      medicine = await Medicine.findById(d.medicineId);
    }

    if (!medicine) {
      medicine = await Medicine.create({
        hospitalId,
        name: data.name,
        category: data.category || 'GENERAL',
        form: 'GENERAL',
        isActive: true,
      });
    }

    const inventoryItem = await Inventory.create({
      hospitalId,
      branchId: req.user?.branchId,
      medicineId: medicine._id,
      batchNumber: d.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
      expiryDate: d.expiryDate ? new Date(d.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      quantity: data.quantity,
      purchasePrice: d.unitCost || d.purchasePrice || 0,
      sellingPrice: d.unitPrice || d.sellingPrice || 0,
      reorderLevel: data.reorderLevel || 10,
      location: data.locationRoom || d.location,
      supplierId: d.supplierId || undefined,
    });

    const populated = await Inventory.findById(inventoryItem._id)
      .populate('medicineId')
      .populate('supplierId');

    await logAudit({
      branchId: req.user?.branchId,
      userId: req.user?.id,
      action: 'INVENTORY_ITEM_CREATED',
      resource: 'hospital_inventory_items',
      details: `Created inventory item ${data.name} (Qty: ${data.quantity})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const itemObj: any = populated ? (populated.toObject ? populated.toObject() : populated) : inventoryItem;
    const medObj: any = itemObj.medicineId || {};

    res.status(201).json({
      status: 'success',
      message: 'Inventory item created successfully.',
      data: {
        item: {
          ...itemObj,
          name: medObj.name || data.name,
          itemCode: medObj.barcode || itemObj.batchNumber,
          category: medObj.category || data.category || 'GENERAL',
          supplier: itemObj.supplierId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updateHospitalInventoryItemSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const existing = await Inventory.findOne(query);
    if (!existing) {
      throw new NotFoundError('Inventory item record not found.');
    }

    const updateData: any = {};
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel;
    if (data.locationRoom) updateData.location = data.locationRoom;
    if (data.supplierId) updateData.supplierId = data.supplierId;
    if (data.unitCost) updateData.purchasePrice = data.unitCost;

    const updated = await Inventory.findByIdAndUpdate(id, updateData, { new: true })
      .populate('medicineId')
      .populate('supplierId');

    const itemObj: any = updated ? (updated.toObject ? updated.toObject() : updated) : {};
    const medObj: any = itemObj.medicineId || {};

    res.status(200).json({
      status: 'success',
      message: 'Inventory item updated successfully.',
      data: {
        item: {
          ...itemObj,
          name: medObj.name || 'Inventory Item',
          itemCode: medObj.barcode || itemObj.batchNumber,
          category: medObj.category || 'GENERAL',
          supplier: itemObj.supplierId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const consumeInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { quantity, notes } = consumeInventoryItemSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    const existing = await Inventory.findOne(query).populate('medicineId');
    if (!existing) {
      throw new NotFoundError('Inventory item not found.');
    }

    if (existing.quantity < quantity) {
      const medName = (existing.medicineId as any)?.name || 'Item';
      throw new ValidationError(
        `Insufficient quantity for '${medName}'. Requested: ${quantity}, Available: ${existing.quantity}`
      );
    }

    existing.quantity -= quantity;
    await existing.save();

    const itemObj: any = existing.toObject ? existing.toObject() : existing;
    const medObj: any = itemObj.medicineId || {};

    res.status(200).json({
      status: 'success',
      message: `Consumed ${quantity} units of ${medObj.name || 'item'}.`,
      data: {
        item: {
          ...itemObj,
          name: medObj.name || 'Inventory Item',
          itemCode: medObj.barcode || itemObj.batchNumber,
          category: medObj.category || 'GENERAL',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
