import { Schema, model, Document, Types } from 'mongoose';

export interface IAIInteractionLog extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  hospitalId?: Types.ObjectId;
  prompt: string;
  response: string;
  provider: string;
  tokensUsed?: number;
  createdAt: Date;
  updatedAt: Date;
}

const aiInteractionLogSchema = new Schema<IAIInteractionLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    provider: { type: String, required: true },
    tokensUsed: { type: Number },
  },
  { timestamps: true }
);

export const AIInteractionLog = model<IAIInteractionLog>('AIInteractionLog', aiInteractionLogSchema);

