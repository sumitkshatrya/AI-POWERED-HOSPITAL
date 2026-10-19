import { Schema, model, Document, Types } from 'mongoose';

export interface IInsurancePolicy extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  patientId: Types.ObjectId;
  providerName: string;
  policyNumber: string;
  groupNumber?: string;
  startDate?: Date;
  endDate?: Date;
  coverageLimit?: number;
  copayAmount?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const insurancePolicySchema = new Schema<IInsurancePolicy>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    providerName: { type: String, required: true },
    policyNumber: { type: String, required: true },
    groupNumber: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    coverageLimit: { type: Number, default: 0 },
    copayAmount: { type: Number, default: 0 },
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const InsurancePolicy = model<IInsurancePolicy>('InsurancePolicy', insurancePolicySchema);

