import { Schema, model, Document as MongooseDocument, Types } from 'mongoose';

export interface IDocument extends MongooseDocument {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId;
  patientId?: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  type: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    fileName: { type: String, required: true },
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

documentSchema.index({ hospitalId: 1, patientId: 1 });

export const DocumentModel = model<IDocument>('Document', documentSchema);

