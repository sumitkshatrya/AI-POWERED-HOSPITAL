import { Schema, model, Document, Types } from 'mongoose';

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'MAINTENANCE';

export interface IBed extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  wardId: Types.ObjectId;
  roomId?: Types.ObjectId;
  bedNumber: string;
  status: BedStatus;
  ratePerDay: number;
  currentAdmissionId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bedSchema = new Schema<IBed>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    bedNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE'],
      default: 'AVAILABLE',
      index: true,
    },
    ratePerDay: { type: Number, default: 0 },
    currentAdmissionId: { type: Schema.Types.ObjectId, ref: 'Admission' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bedSchema.index({ hospitalId: 1, wardId: 1, status: 1 });

export const Bed = model<IBed>('Bed', bedSchema);

