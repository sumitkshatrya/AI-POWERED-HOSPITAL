import { Schema, model, Document, Types } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  invoiceNumber: string;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    invoiceNumber: { type: String, required: true },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        unitPrice: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'],
      default: 'UNPAID',
      index: true,
    },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

invoiceSchema.index({ hospitalId: 1, patientId: 1 });

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);

