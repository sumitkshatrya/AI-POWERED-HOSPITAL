import { Schema, model, Document, Types } from 'mongoose';

export type OpdQueueStatus = 'WAITING' | 'ENGAGED_WITH_DOCTOR' | 'PASSED' | 'COMPLETED';

export interface IOpdQueue extends Document {
  _id: Types.ObjectId;
  hospitalId?: Types.ObjectId;
  branchId?: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  tokenNumber: number;
  queueStatus: OpdQueueStatus;
  priority?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const opdQueueSchema = new Schema<IOpdQueue>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', index: true },
    tokenNumber: { type: Number, required: true },
    queueStatus: {
      type: String,
      enum: ['WAITING', 'ENGAGED_WITH_DOCTOR', 'PASSED', 'COMPLETED'],
      default: 'WAITING',
      index: true,
    },
    priority: { type: String, default: 'NORMAL' },
    notes: { type: String },
  },
  { timestamps: true }
);

opdQueueSchema.index({ doctorId: 1, queueStatus: 1 });
opdQueueSchema.index({ branchId: 1, queueStatus: 1 });

export const OpdQueue = model<IOpdQueue>('OpdQueue', opdQueueSchema);
