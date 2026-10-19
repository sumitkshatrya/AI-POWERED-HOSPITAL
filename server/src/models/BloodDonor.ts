import { Schema, model, Document, Types } from 'mongoose';

export interface IBloodDonor extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  name: string;
  age?: number;
  gender?: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  email?: string;
  address?: string;
  lastDonatedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bloodDonorSchema = new Schema<IBloodDonor>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
      index: true,
    },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    lastDonatedDate: { type: Date },
  },
  { timestamps: true }
);

export const BloodDonor = model<IBloodDonor>('BloodDonor', bloodDonorSchema);

