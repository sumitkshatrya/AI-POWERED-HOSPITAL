import { Schema, model, Document, Types } from 'mongoose';

export interface IConsultation extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  chiefComplaint?: string;
  symptoms?: string[];
  vitals?: {
    bpSystolic?: number;
    bpDiastolic?: number;
    pulseRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    spo2?: number;
    height?: number;
    weight?: number;
    bmi?: number;
  };
  examination?: string;
  assessment?: string;
  diagnosis?: string[];
  treatmentPlan?: string;
  followUpDate?: Date;
  status: 'DRAFT' | 'FINAL';
  createdAt: Date;
  updatedAt: Date;
}

const consultationSchema = new Schema<IConsultation>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', index: true },
    chiefComplaint: { type: String },
    symptoms: [{ type: String }],
    vitals: {
      bpSystolic: Number,
      bpDiastolic: Number,
      pulseRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      spo2: Number,
      height: Number,
      weight: Number,
      bmi: Number,
    },
    examination: { type: String },
    assessment: { type: String },
    diagnosis: [{ type: String }],
    treatmentPlan: { type: String },
    followUpDate: { type: Date },
    status: { type: String, enum: ['DRAFT', 'FINAL'], default: 'FINAL' },
  },
  { timestamps: true }
);

consultationSchema.index({ hospitalId: 1, patientId: 1 });

export const Consultation = model<IConsultation>('Consultation', consultationSchema);

