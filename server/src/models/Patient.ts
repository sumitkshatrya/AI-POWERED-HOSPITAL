import { Schema, model, Document, Types } from 'mongoose';

export interface IPatient extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  patientId: string;
  mrn: string;
  uhid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  allergies?: string[];
  chronicConditions?: string[];
  previousSurgeries?: string[];
  currentMedications?: string[];
  familyHistory?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  coverage?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    patientId: { type: String, required: true, index: true },
    mrn: { type: String, required: true, index: true },
    uhid: { type: String },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    address: { type: String },
    emergencyContact: { type: String },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    previousSurgeries: [{ type: String }],
    currentMedications: [{ type: String }],
    familyHistory: { type: String },
    insuranceProvider: { type: String },
    policyNumber: { type: String },
    coverage: { type: String },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

patientSchema.pre('save', function (next) {
  if (!this.uhid) {
    this.uhid = this.patientId || this.mrn;
  }
  next();
});

patientSchema.index({ hospitalId: 1, patientId: 1 }, { unique: true });
patientSchema.index({ hospitalId: 1, mrn: 1 }, { unique: true });
patientSchema.index({ hospitalId: 1, branchId: 1 });

export const Patient = model<IPatient>('Patient', patientSchema);
