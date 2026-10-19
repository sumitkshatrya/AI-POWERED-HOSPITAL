import { Schema, model, Document, Types } from 'mongoose';

export interface IMedicalRecord extends Document {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  doctorId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  consultationId?: Types.ObjectId;
  prescriptionId?: Types.ObjectId;
  labReportId?: Types.ObjectId;
  radiologyReportId?: Types.ObjectId;
  admissionId?: Types.ObjectId;
  dischargeSummaryId?: Types.ObjectId;
  recordType: string;
  title: string;
  description?: string;
  recordDate: Date;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const medicalRecordSchema = new Schema<IMedicalRecord>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    consultationId: { type: Schema.Types.ObjectId, ref: 'Consultation' },
    prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    labReportId: { type: Schema.Types.ObjectId, ref: 'LabReport' },
    radiologyReportId: { type: Schema.Types.ObjectId, ref: 'RadiologyOrder' },
    admissionId: { type: Schema.Types.ObjectId, ref: 'Admission' },
    dischargeSummaryId: { type: Schema.Types.ObjectId, ref: 'DischargeSummary' },
    recordType: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    recordDate: { type: Date, default: Date.now },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

medicalRecordSchema.index({ hospitalId: 1, patientId: 1, recordDate: -1 });

export const MedicalRecord = model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);

