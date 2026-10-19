import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  amount: number;
  method: string;
  transactionId?: string;
  paymentDate: Date;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    transactionId: { type: String },
    paymentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);

