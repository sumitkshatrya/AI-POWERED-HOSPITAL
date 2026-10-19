import { Schema, model, Document, Types } from 'mongoose';

export interface IPrescriptionMedicine {
  medicineId?: Types.ObjectId;
  name: string;
  strength?: string;
  dose: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export interface IPrescription extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  consultationId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  medicines: IPrescriptionMedicine[];
  doctorInstructions?: string;
  followUpDate?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    consultationId: { type: Schema.Types.ObjectId, ref: 'Consultation' },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    medicines: [
      {
        medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine' },
        name: { type: String, required: true },
        strength: { type: String },
        dose: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        route: { type: String },
        instructions: { type: String },
      },
    ],
    doctorInstructions: { type: String },
    followUpDate: { type: Date },
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: true }
);

prescriptionSchema.index({ hospitalId: 1, patientId: 1 });

export const Prescription = model<IPrescription>('Prescription', prescriptionSchema);

