import { Schema, model, Document, Types } from 'mongoose';

export interface IInventory extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  medicineId: Types.ObjectId;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  reorderLevel: number;
  location?: string;
  supplierId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    batchNumber: { type: String, required: true, index: true },
    expiryDate: { type: Date, required: true, index: true },
    quantity: { type: Number, required: true, default: 0, index: true },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    reorderLevel: { type: Number, default: 10 },
    location: { type: String },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  },
  { timestamps: true }
);

inventorySchema.index({ hospitalId: 1, medicineId: 1, batchNumber: 1 });
inventorySchema.index({ hospitalId: 1, expiryDate: 1 });

export const Inventory = model<IInventory>('Inventory', inventorySchema);

