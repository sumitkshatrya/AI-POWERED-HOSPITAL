import { Schema, model, Document, Types } from 'mongoose';

export interface IMedicine extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  name: string;
  brandName?: string;
  genericName?: string;
  category: string;
  form: string;
  manufacturer?: string;
  description?: string;
  barcode?: string;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    brandName: { type: String, trim: true },
    genericName: { type: String, trim: true },
    category: { type: String, required: true },
    form: { type: String, required: true },
    manufacturer: { type: String },
    description: { type: String },
    barcode: { type: String },
    unit: { type: String, default: 'TABLET' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

medicineSchema.index({ hospitalId: 1, name: 1 });

export const Medicine = model<IMedicine>('Medicine', medicineSchema);

