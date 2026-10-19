import { Schema, model, Document, Types } from 'mongoose';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  type?: string;
  status: AppointmentStatus;
  tokenNumber?: number;
  consultationFee?: number;
  paymentStatus?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    appointmentDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: { type: String, default: 'IN_PERSON' },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'PENDING',
    },
    tokenNumber: { type: Number },
    consultationFee: { type: Number, default: 0 },
    paymentStatus: { type: String, default: 'PENDING' },
    notes: { type: String },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ hospitalId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, startTime: 1 });

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);

