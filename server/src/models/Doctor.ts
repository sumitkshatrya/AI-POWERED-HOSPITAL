import { Schema, model, Document, Types } from 'mongoose';

export interface IDoctor extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  registrationNumber?: string;
  specialization: string;
  qualifications?: string;
  experience?: number;
  languages?: string[];
  consultationFee: number;
  bio?: string;
  services?: string[];
  onlineConsultation: boolean;
  rating: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    registrationNumber: { type: String, trim: true },
    specialization: { type: String, required: true, index: true },
    qualifications: { type: String },
    experience: { type: Number, default: 0 },
    languages: [{ type: String }],
    consultationFee: { type: Number, required: true, default: 0 },
    bio: { type: String },
    services: [{ type: String }],
    onlineConsultation: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.index({ hospitalId: 1, branchId: 1, specialization: 1 });

export const Doctor = model<IDoctor>('Doctor', doctorSchema);

