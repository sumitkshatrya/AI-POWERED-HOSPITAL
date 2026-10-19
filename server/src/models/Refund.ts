import { Schema, model, Document, Types } from 'mongoose';

export interface IRefund extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  paymentId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  amount: number;
  reason?: string;
  processedBy?: Types.ObjectId;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    amount: { type: Number, required: true },
    reason: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'COMPLETED' },
  },
  { timestamps: true }
);

export const Refund = model<IRefund>('Refund', refundSchema);

