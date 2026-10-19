import { Schema, model, Document, Types } from 'mongoose';

export interface ILabTest extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  code: string;
  name: string;
  category: string;
  price: number;
  turnaroundTime?: string;
  testDetails?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const labTestSchema = new Schema<ILabTest>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    turnaroundTime: { type: String },
    testDetails: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

labTestSchema.index({ hospitalId: 1, code: 1 }, { unique: true });

export const LabTest = model<ILabTest>('LabTest', labTestSchema);

