import { Schema, model, Document, Types } from 'mongoose';

export interface IRoom extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  wardId: Types.ObjectId;
  roomNumber: string;
  roomType: string;
  ratePerDay: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true, index: true },
    roomNumber: { type: String, required: true },
    roomType: { type: String, required: true },
    ratePerDay: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Room = model<IRoom>('Room', roomSchema);

