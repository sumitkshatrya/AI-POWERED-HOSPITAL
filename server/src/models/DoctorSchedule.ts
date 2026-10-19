import { Schema, model, Document, Types } from 'mongoose';

export interface IDoctorSchedule extends Document {
  _id: Types.ObjectId;
  doctorId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "17:00"
  breaks?: { startTime: string; endTime: string }[];
  appointmentDuration: number; // minutes
  maxAppointments?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorScheduleSchema = new Schema<IDoctorSchedule>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    dayOfWeek: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    breaks: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
    appointmentDuration: { type: Number, default: 30 },
    maxAppointments: { type: Number, default: 20 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorScheduleSchema.index({ doctorId: 1, hospitalId: 1, dayOfWeek: 1 });

export const DoctorSchedule = model<IDoctorSchedule>('DoctorSchedule', doctorScheduleSchema);

export interface IDoctorLeave extends Document {
  _id: Types.ObjectId;
  doctorId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: string;
}

const doctorLeaveSchema = new Schema<IDoctorLeave>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
  },
  { timestamps: true }
);

export const DoctorLeave = model<IDoctorLeave>('DoctorLeave', doctorLeaveSchema);

export interface IHoliday extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  date: Date;
  name: string;
}

const holidaySchema = new Schema<IHoliday>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    date: { type: Date, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const Holiday = model<IHoliday>('Holiday', holidaySchema);

