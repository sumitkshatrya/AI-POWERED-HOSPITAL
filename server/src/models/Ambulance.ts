import { Schema, model, Document, Types } from 'mongoose';

export type AmbulanceStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'AT_LOCATION'
  | 'TRANSPORTING'
  | 'COMPLETED'
  | 'MAINTENANCE';

export interface IAmbulance extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  vehicleNumber: string;
  driverId?: Types.ObjectId;
  driverName?: string;
  contact: string;
  status: AmbulanceStatus;
  currentLocation?: string;
  equipment?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ambulanceSchema = new Schema<IAmbulance>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    vehicleNumber: { type: String, required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },
    driverName: { type: String },
    contact: { type: String, required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'AT_LOCATION', 'TRANSPORTING', 'COMPLETED', 'MAINTENANCE'],
      default: 'AVAILABLE',
    },
    currentLocation: { type: String },
    equipment: [{ type: String }],
  },
  { timestamps: true }
);

ambulanceSchema.index({ hospitalId: 1, status: 1 });

export const Ambulance = model<IAmbulance>('Ambulance', ambulanceSchema);

