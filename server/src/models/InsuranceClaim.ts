import { Schema, model, Document, Types } from 'mongoose';

export type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED';

export interface IInsuranceClaim extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  patientId: Types.ObjectId;
  policyId?: Types.ObjectId;
  claimNumber: string;
  invoiceId?: Types.ObjectId;
  claimAmount: number;
  approvedAmount?: number;
  status: ClaimStatus;
  submissionDate?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const insuranceClaimSchema = new Schema<IInsuranceClaim>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    policyId: { type: Schema.Types.ObjectId, ref: 'InsurancePolicy' },
    claimNumber: { type: String, required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    claimAmount: { type: Number, required: true },
    approvedAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED'],
      default: 'DRAFT',
      index: true,
    },
    submissionDate: { type: Date },
    remarks: { type: String },
  },
  { timestamps: true }
);

insuranceClaimSchema.index({ hospitalId: 1, patientId: 1 });

export const InsuranceClaim = model<IInsuranceClaim>('InsuranceClaim', insuranceClaimSchema);

