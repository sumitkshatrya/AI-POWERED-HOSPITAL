import { Schema, model, Document, Types } from 'mongoose';

export type LabOrderStatus = 'ORDERED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'VERIFIED' | 'CANCELLED';

export interface ILabOrder extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  orderNumber: string;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  testId?: Types.ObjectId;
  tests?: Types.ObjectId[];
  orderDate: Date;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  status: LabOrderStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const labOrderSchema = new Schema<ILabOrder>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    orderNumber: { type: String, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    testId: { type: Schema.Types.ObjectId, ref: 'LabTest' },
    tests: [{ type: Schema.Types.ObjectId, ref: 'LabTest' }],
    orderDate: { type: Date, default: Date.now },
    priority: { type: String, enum: ['ROUTINE', 'URGENT', 'STAT'], default: 'ROUTINE' },
    status: {
      type: String,
      enum: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'VERIFIED', 'CANCELLED'],
      default: 'ORDERED',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

labOrderSchema.index({ hospitalId: 1, patientId: 1 });

export const LabOrder = model<ILabOrder>('LabOrder', labOrderSchema);

