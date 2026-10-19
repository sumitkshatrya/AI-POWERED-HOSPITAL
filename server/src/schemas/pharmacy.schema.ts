import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  code: z.string().optional(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().min(1, 'Contact phone is required'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createMedicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  genericName: z.string().min(1, 'Generic name is required'),
  brand: z.string().min(1, 'Brand is required'),
  category: z.string().default('GENERAL'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  quantity: z.number().int().min(0).default(0),
  minReorderLevel: z.number().int().min(0).default(20),
  purchasePrice: z.number().min(0).default(0.0),
  sellingPrice: z.number().min(0).default(0.0),
  locationRack: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).default('ACTIVE'),
});

export const updateMedicineSchema = createMedicineSchema.partial();

export const stockAdjustmentSchema = z.object({
  newQuantity: z.number().int().min(0, 'Quantity cannot be negative'),
  reason: z.string().optional().nullable(),
});

export const createPharmacySaleSchema = z.object({
  patientId: z.string().optional().nullable(),
  prescriptionId: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'INSURANCE']).default('CASH'),
  discount: z.number().min(0).default(0),
  remarks: z.string().optional().nullable(),
  items: z.array(
    z.object({
      medicineId: z.string().min(1, 'Medicine ID is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().optional(),
    })
  ).min(1, 'At least one medicine item is required for a sale'),
});

export const fulfillPrescriptionSchema = z.object({
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'INSURANCE']).default('CASH'),
  discount: z.number().min(0).default(0),
  remarks: z.string().optional().nullable(),
});

export const createHospitalInventoryItemSchema = z.object({
  name: z.string().min(1, 'Inventory item name is required'),
  itemCode: z.string().optional(),
  category: z.enum([
    'MEDICAL_EQUIPMENT',
    'SURGICAL_SUPPLIES',
    'CONSUMABLES',
    'PPE',
    'SYRINGES',
    'GLOVES',
    'MASKS',
    'OTHER',
  ]).default('CONSUMABLES'),
  unitOfMeasure: z.string().default('PIECES'),
  quantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(50),
  unitCost: z.number().min(0).default(0.0),
  locationRoom: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'MAINTENANCE']).default('IN_STOCK'),
});

export const updateHospitalInventoryItemSchema = createHospitalInventoryItemSchema.partial();

export const consumeInventoryItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity consumed must be at least 1'),
  notes: z.string().optional().nullable(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;
export type UpdateMedicineInput = z.infer<typeof updateMedicineSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type CreatePharmacySaleInput = z.infer<typeof createPharmacySaleSchema>;
export type FulfillPrescriptionInput = z.infer<typeof fulfillPrescriptionSchema>;
export type CreateHospitalInventoryItemInput = z.infer<typeof createHospitalInventoryItemSchema>;
export type ConsumeInventoryItemInput = z.infer<typeof consumeInventoryItemSchema>;

