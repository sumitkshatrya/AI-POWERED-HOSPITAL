import { Schema, model, Document, Types } from 'mongoose';

export type TriageLevel = 'RESUSCITATION' | 'EMERGENT' | 'URGENT' | 'LESS_URGENT' | 'NON_URGENT';

export interface IEmergencyCase extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  branchId?: Types.ObjectId;
  caseNumber: string;
  patientId?: Types.ObjectId;
  patientName?: string;
  arrivalTime: Date;
  emergencyType: string;
  triageLevel: TriageLevel;
  vitals?: Record<string, any>;
  assignedDoctorId?: Types.ObjectId;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyCaseSchema = new Schema<IEmergencyCase>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    caseNumber: { type: String, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', index: true },
    patientName: { type: String },
    arrivalTime: { type: Date, default: Date.now },
    emergencyType: { type: String, required: true },
    triageLevel: {
      type: String,
      enum: ['RESUSCITATION', 'EMERGENT', 'URGENT', 'LESS_URGENT', 'NON_URGENT'],
      default: 'URGENT',
    },
    vitals: { type: Schema.Types.Mixed },
    assignedDoctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    status: { type: String, default: 'TRIAGED' },
    notes: { type: String },
  },
  { timestamps: true }
);

emergencyCaseSchema.index({ hospitalId: 1, arrivalTime: -1 });

export const EmergencyCase = model<IEmergencyCase>('EmergencyCase', emergencyCaseSchema);

