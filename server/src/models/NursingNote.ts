import { Schema, model, Document, Types } from 'mongoose';

export interface INursingNote extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  admissionId: Types.ObjectId;
  patientId: Types.ObjectId;
  nurseId: Types.ObjectId;
  noteDate: Date;
  note: string;
  vitals?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const nursingNoteSchema = new Schema<INursingNote>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    admissionId: { type: Schema.Types.ObjectId, ref: 'Admission', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    nurseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    noteDate: { type: Date, default: Date.now },
    note: { type: String, required: true },
    vitals: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const NursingNote = model<INursingNote>('NursingNote', nursingNoteSchema);

