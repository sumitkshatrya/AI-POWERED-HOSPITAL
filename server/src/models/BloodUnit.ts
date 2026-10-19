import { Schema, model, Document, Types } from 'mongoose';

export type BloodUnitStatus = 'AVAILABLE' | 'RESERVED' | 'ISSUED' | 'EXPIRED';

export interface IBloodUnit extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  unitNumber: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  collectionDate: Date;
  expiryDate: Date;
  status: BloodUnitStatus;
  storageLocation?: string;
  donorId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bloodUnitSchema = new Schema<IBloodUnit>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    unitNumber: { type: String, required: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
      index: true,
    },
    collectionDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'ISSUED', 'EXPIRED'],
      default: 'AVAILABLE',
      index: true,
    },
    storageLocation: { type: String },
    donorId: { type: Schema.Types.ObjectId, ref: 'BloodDonor' },
  },
  { timestamps: true }
);

bloodUnitSchema.index({ hospitalId: 1, bloodGroup: 1, status: 1 });

export const BloodUnit = model<IBloodUnit>('BloodUnit', bloodUnitSchema);

