import { Schema, model, Document, Types } from 'mongoose';
import { Role } from '../types/roles';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  passwordHash?: string;
  role: Role;
  hospitalId?: Types.ObjectId;
  branchId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  joiningDate?: Date;
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
  isVerified: boolean;
  profileImage?: string;
  lastLogin?: Date;
  status?: string;
  refreshTokens?: any[];
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    password: { type: String, select: false },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: Object.values(Role), required: true, default: Role.PATIENT },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    joiningDate: { type: Date },
    specialization: { type: String },
    licenseNumber: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    profileImage: { type: String },
    lastLogin: { type: Date },
    status: { type: String, default: 'ACTIVE' },
    refreshTokens: [{ type: Schema.Types.Mixed }],
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ hospitalId: 1, role: 1 });

export const User = model<IUser>('User', userSchema);
