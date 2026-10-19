import { Schema, model, Document, Types } from 'mongoose';

export interface IRadiologyOrder extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  orderNumber: string;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  procedureName: string;
  modality: string;
  priority: string;
  status: string;
  findings?: string;
  impression?: string;
  radiologistId?: Types.ObjectId;
  reportUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const radiologyOrderSchema = new Schema<IRadiologyOrder>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    orderNumber: { type: String, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    procedureName: { type: String, required: true },
    modality: { type: String, required: true },
    priority: { type: String, default: 'ROUTINE' },
    status: { type: String, default: 'ORDERED' },
    findings: { type: String },
    impression: { type: String },
    radiologistId: { type: Schema.Types.ObjectId, ref: 'User' },
    reportUrl: { type: String },
  },
  { timestamps: true }
);

export const RadiologyOrder = model<IRadiologyOrder>('RadiologyOrder', radiologyOrderSchema);

