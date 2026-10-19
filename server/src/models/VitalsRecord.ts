import { Schema, model, Document, Types } from 'mongoose';

export interface IVitalsRecord extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  patientId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  recordedBy?: Types.ObjectId;
  recordedAt: Date;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  spo2?: number;
  weight?: number;
  weightKg?: number;
  height?: number;
  heightCm?: number;
  bmi?: number;
  bloodGlucose?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vitalsRecordSchema = new Schema<IVitalsRecord>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    recordedAt: { type: Date, default: Date.now },
    systolicBp: { type: Number },
    diastolicBp: { type: Number },
    pulseRate: { type: Number },
    temperature: { type: Number },
    respiratoryRate: { type: Number },
    spo2: { type: Number },
    weight: { type: Number },
    weightKg: { type: Number },
    height: { type: Number },
    heightCm: { type: Number },
    bmi: { type: Number },
    bloodGlucose: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

vitalsRecordSchema.index({ hospitalId: 1, patientId: 1, recordedAt: -1 });

export const VitalsRecord = model<IVitalsRecord>('VitalsRecord', vitalsRecordSchema);

