import { Schema, model, Document, Types } from 'mongoose';

export interface IPharmacySaleItem {
  medicineId: Types.ObjectId;
  batchNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IPharmacySale extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  patientId?: Types.ObjectId;
  prescriptionId?: Types.ObjectId;
  saleNumber: string;
  saleDate: Date;
  items: IPharmacySaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const pharmacySaleSchema = new Schema<IPharmacySale>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    saleNumber: { type: String, required: true },
    saleDate: { type: Date, default: Date.now },
    items: [
      {
        medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
        batchNumber: { type: String },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, default: 'PAID' },
    paymentMethod: { type: String, default: 'CASH' },
    status: { type: String, default: 'COMPLETED' },
  },
  { timestamps: true }
);

pharmacySaleSchema.index({ hospitalId: 1, saleDate: -1 });

export const PharmacySale = model<IPharmacySale>('PharmacySale', pharmacySaleSchema);

