import { Schema, model, Document, Types } from 'mongoose';

export interface IBranch extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  name: string;
  code?: string;
  address: string;
  phone: string;
  email: string;
  contactPhone?: string;
  contactEmail?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  timeZone?: string;
  workingHours?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String },
    address: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    contactPhone: { type: String },
    contactEmail: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    timeZone: { type: String },
    workingHours: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchSchema.index({ hospitalId: 1, isActive: 1 });

export const Branch = model<IBranch>('Branch', branchSchema);

