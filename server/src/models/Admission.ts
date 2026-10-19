import { Schema, model, Document, Types } from 'mongoose';

export type AdmissionStatus = 'ADMITTED' | 'DISCHARGED' | 'TRANSFERRED' | 'DECEASED';

export interface IAdmission extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  admissionNumber: string;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  bedId: Types.ObjectId;
  admissionDate: Date;
  dischargeDate?: Date;
  reason?: string;
  diagnosis?: string;
  status: AdmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const admissionSchema = new Schema<IAdmission>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    admissionNumber: { type: String, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
    admissionDate: { type: Date, default: Date.now },
    dischargeDate: { type: Date },
    reason: { type: String },
    diagnosis: { type: String },
    status: {
      type: String,
      enum: ['ADMITTED', 'DISCHARGED', 'TRANSFERRED', 'DECEASED'],
      default: 'ADMITTED',
    },
  },
  { timestamps: true }
);

admissionSchema.index({ hospitalId: 1, patientId: 1, status: 1 });

export const Admission = model<IAdmission>('Admission', admissionSchema);

