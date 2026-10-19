import { Schema, model, Document, Types } from 'mongoose';

export interface ILabReport extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  orderId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  labTestId?: Types.ObjectId;
  results: Record<string, any>;
  summary?: string;
  status: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const labReportSchema = new Schema<ILabReport>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'LabOrder', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    labTestId: { type: Schema.Types.ObjectId, ref: 'LabTest' },
    results: { type: Schema.Types.Mixed, required: true },
    summary: { type: String },
    status: { type: String, default: 'COMPLETED' },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

labReportSchema.index({ hospitalId: 1, patientId: 1 });

export const LabReport = model<ILabReport>('LabReport', labReportSchema);

