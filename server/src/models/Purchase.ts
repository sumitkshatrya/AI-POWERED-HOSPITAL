import { Schema, model, Document, Types } from 'mongoose';

export interface IPurchaseItem {
  medicineId: Types.ObjectId;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  purchasePrice: number;
  totalAmount: number;
}

export interface IPurchase extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  supplierId: Types.ObjectId;
  purchaseDate: Date;
  items: IPurchaseItem[];
  totalAmount: number;
  invoiceNumber?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    purchaseDate: { type: Date, default: Date.now },
    items: [
      {
        medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
        batchNumber: { type: String, required: true },
        expiryDate: { type: Date, required: true },
        quantity: { type: Number, required: true },
        purchasePrice: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    invoiceNumber: { type: String },
    status: { type: String, default: 'COMPLETED' },
  },
  { timestamps: true }
);

export const Purchase = model<IPurchase>('Purchase', purchaseSchema);

