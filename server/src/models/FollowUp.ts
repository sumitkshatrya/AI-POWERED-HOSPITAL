import { Schema, model, Document, Types } from 'mongoose';

export interface IFollowUp extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  followUpDate: Date;
  reason?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const followUpSchema = new Schema<IFollowUp>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    followUpDate: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, default: 'SCHEDULED' },
  },
  { timestamps: true }
);

export const FollowUp = model<IFollowUp>('FollowUp', followUpSchema);

