import { Schema, model, Document, Types } from 'mongoose';

export interface IHospital extends Document {
  _id: Types.ObjectId;
  name: string;
  logo?: string;
  registrationNumber?: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  emergencyContact?: string;
  workingHours?: string;
  facilities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String },
    registrationNumber: { type: String, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String },
    address: { type: String, required: true },
    emergencyContact: { type: String },
    workingHours: { type: String },
    facilities: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Hospital = model<IHospital>('Hospital', hospitalSchema);

