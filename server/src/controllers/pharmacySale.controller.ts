import { Request, Response, NextFunction } from 'express';
import { PharmacySale, Inventory, Medicine, Patient, Prescription } from '../models';
import { createPharmacySaleSchema, fulfillPrescriptionSchema } from '../schemas/pharmacy.schema';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logAudit } from '../utils/audit';

export const getPharmacySales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, patientId, page, limit } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (req.user?.hospitalId) {
      query.hospitalId = req.user.hospitalId;
    }

    if (patientId) query.patientId = patientId as string;
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { saleNumber: searchRegex },
      ];
    }

    const [totalCount, rawSales] = await Promise.all([
      PharmacySale.countDocuments(query),
      PharmacySale.find(query)
        .populate('patientId', 'firstName lastName uhid mrn')
        .populate('prescriptionId', 'prescriptionCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const sales = rawSales.map((s: any) => {
      const sObj: any = s.toObject ? s.toObject() : s;
      return {
        ...sObj,
        patient: sObj.patientId,
        prescription: sObj.prescriptionId,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        sales,
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

export const createPharmacySale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createPharmacySaleSchema.parse(req.body);
    const hospitalId = req.user?.hospitalId;

    const saleItemsData: Array<{
      medicineId: any;
      medicineName: string;
      batchNumber: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      inventoryDoc?: any;
    }> = [];

    let subtotal = 0;

    for (const item of data.items) {
      // Find stock in Inventory or Medicine
      let inv = await Inventory.findOne({
        medicineId: item.medicineId,
        ...(hospitalId ? { hospitalId } : {}),
      }).populate('medicineId');

      let med: any;
      if (!inv) {
        med = await Medicine.findById(item.medicineId);
        if (!med) {
          throw new NotFoundError(`Medicine with ID ${item.medicineId} not found.`);
        }
      } else {
        med = inv.medicineId as any;
      }

      const availableQty = inv ? inv.quantity : 100;
      if (availableQty < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for '${med?.name || 'Medicine'}'. Requested: ${item.quantity}, Available: ${availableQty}`
        );
      }

      const unitPrice = item.unitPrice ?? inv?.sellingPrice ?? 10.0;
      const totalPrice = parseFloat((unitPrice * item.quantity).toFixed(2));
      subtotal += totalPrice;

      saleItemsData.push({
        medicineId: med?._id || item.medicineId,
        medicineName: med?.name || 'Medicine',
        batchNumber: inv?.batchNumber || 'BATCH-001',
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        inventoryDoc: inv,
      });
    }

    const discount = data.discount || 0;
    const totalAmount = Math.max(0, parseFloat((subtotal - discount).toFixed(2)));
    const saleNumber = `PSALE-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    let patientBranchId: any = req.user?.branchId;
    let patientHospitalId: any = hospitalId || req.user?.hospitalId;

    if (data.patientId) {
      const pat = await Patient.findById(data.patientId);
      if (pat) {
        patientBranchId = pat.branchId;
        patientHospitalId = pat.hospitalId || patientHospitalId;
      }
    }

    const sale = await PharmacySale.create({
      saleNumber,
      hospitalId: patientHospitalId,
      branchId: patientBranchId,
      patientId: data.patientId || undefined,
      prescriptionId: data.prescriptionId || undefined,
      subtotal,
      discount,
      tax: 0,
      totalAmount,
      paymentStatus: 'PAID',
      paymentMethod: data.paymentMethod,
      status: 'COMPLETED',
      items: saleItemsData.map((si) => ({
        medicineId: si.medicineId,
        batchNumber: si.batchNumber,
        quantity: si.quantity,
        unitPrice: si.unitPrice,
        totalPrice: si.totalPrice,
      })),
    });

    // Update inventory stock
    for (const si of saleItemsData) {
      if (si.inventoryDoc) {
        si.inventoryDoc.quantity = Math.max(0, si.inventoryDoc.quantity - si.quantity);
        await si.inventoryDoc.save();
      }
    }

    await logAudit({
      branchId: patientBranchId?.toString(),
      userId: req.user?.id,
      action: 'PHARMACY_SALE_CREATED',
      resource: 'pharmacy_sales',
      details: `Created POS Pharmacy Sale ${saleNumber} for amount $${totalAmount}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const populatedSale = await PharmacySale.findById(sale._id)
      .populate('patientId')
      .populate('prescriptionId');

    res.status(201).json({
      status: 'success',
      message: 'Pharmacy sale completed successfully.',
      data: { sale: populatedSale || sale },
    });
  } catch (err) {
    next(err);
  }
};

export const fulfillPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prescriptionId, paymentMethod, discount, remarks } = fulfillPrescriptionSchema.parse(req.body);
    const hospitalId = req.user?.hospitalId;

    const prescription = await Prescription.findById(prescriptionId).populate('patientId');
    if (!prescription) {
      throw new NotFoundError('Prescription record not found.');
    }

    const patientObj = prescription.patientId as any;

    const saleItemsData: Array<{
      medicineId: any;
      medicineName: string;
      batchNumber: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      inventoryDoc?: any;
    }> = [];

    let subtotal = 0;
    const rxItems = (prescription as any).items || [];

    for (const rxItem of rxItems) {
      const medName = rxItem.medicineName || rxItem.name || 'Medicine';
      const med = await Medicine.findOne({
        name: new RegExp(medName, 'i'),
        ...(hospitalId ? { hospitalId } : {}),
      });

      const inv = await Inventory.findOne({
        ...(med ? { medicineId: med._id } : {}),
        ...(hospitalId ? { hospitalId } : {}),
      });

      const reqQty = rxItem.quantity || 1;
      const unitPrice = inv?.sellingPrice || 10.0;
      const totalPrice = parseFloat((unitPrice * reqQty).toFixed(2));
      subtotal += totalPrice;

      saleItemsData.push({
        medicineId: med?._id || prescription._id,
        medicineName: medName,
        batchNumber: inv?.batchNumber || 'BATCH-001',
        quantity: reqQty,
        unitPrice,
        totalPrice,
        inventoryDoc: inv,
      });
    }

    const discountAmount = discount || 0;
    const totalAmount = Math.max(0, parseFloat((subtotal - discountAmount).toFixed(2)));
    const saleNumber = `DISP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const sale = await PharmacySale.create({
      saleNumber,
      hospitalId: patientObj?.hospitalId || hospitalId,
      branchId: patientObj?.branchId,
      patientId: prescription.patientId,
      prescriptionId: prescription._id,
      subtotal,
      discount: discountAmount,
      tax: 0,
      totalAmount,
      paymentStatus: 'PAID',
      paymentMethod,
      status: 'COMPLETED',
      items: saleItemsData.map((si) => ({
        medicineId: si.medicineId,
        batchNumber: si.batchNumber,
        quantity: si.quantity,
        unitPrice: si.unitPrice,
        totalPrice: si.totalPrice,
      })),
    });

    // Deduct stock
    for (const si of saleItemsData) {
      if (si.inventoryDoc) {
        si.inventoryDoc.quantity = Math.max(0, si.inventoryDoc.quantity - si.quantity);
        await si.inventoryDoc.save();
      }
    }

    await logAudit({
      branchId: patientObj?.branchId?.toString(),
      userId: req.user?.id,
      action: 'PRESCRIPTION_FULFILLED',
      resource: 'pharmacy_sales',
      details: `Fulfilled prescription (Sale ${saleNumber})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const populatedSale = await PharmacySale.findById(sale._id)
      .populate('patientId')
      .populate('prescriptionId');

    res.status(201).json({
      status: 'success',
      message: 'Prescription fulfilled and medicines dispensed successfully.',
      data: { sale: populatedSale || sale },
    });
  } catch (err) {
    next(err);
  }
};
