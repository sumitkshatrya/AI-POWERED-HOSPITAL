import { Schema, model, Document, Types } from 'mongoose';

export interface IICUAdmission extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  admissionId: Types.ObjectId;
  patientId: Types.ObjectId;
  icuBedNumber: string;
  entryDate: Date;
  exitDate?: Date;
  ventilatorRequired: boolean;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const icuAdmissionSchema = new Schema<IICUAdmission>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    admissionId: { type: Schema.Types.ObjectId, ref: 'Admission', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    icuBedNumber: { type: String, required: true },
    entryDate: { type: Date, default: Date.now },
    exitDate: { type: Date },
    ventilatorRequired: { type: Boolean, default: false },
    status: { type: String, default: 'ACTIVE' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ICUAdmission = model<IICUAdmission>('ICUAdmission', icuAdmissionSchema);

