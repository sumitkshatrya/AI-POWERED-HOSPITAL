import { Schema, model, Document, Types } from 'mongoose';

export interface IDischargeSummary extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  admissionId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  dischargeDate: Date;
  summary: string;
  conditionAtDischarge?: string;
  instructions?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dischargeSummarySchema = new Schema<IDischargeSummary>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    admissionId: { type: Schema.Types.ObjectId, ref: 'Admission', required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    dischargeDate: { type: Date, default: Date.now },
    summary: { type: String, required: true },
    conditionAtDischarge: { type: String },
    instructions: { type: String },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

export const DischargeSummary = model<IDischargeSummary>('DischargeSummary', dischargeSummarySchema);

