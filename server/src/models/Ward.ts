import { Schema, model, Document, Types } from 'mongoose';

export interface IWard extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  name: string;
  code: string;
  type: string;
  gender?: string;
  totalBeds: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const wardSchema = new Schema<IWard>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    name: { type: String, required: true },
    code: { type: String, required: true },
    type: { type: String, required: true },
    gender: { type: String },
    totalBeds: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Ward = model<IWard>('Ward', wardSchema);

