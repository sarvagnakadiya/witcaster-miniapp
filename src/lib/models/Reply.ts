import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReplyOption {
  text: string;
  personalization?: string;
  posted?: boolean;
  postedAt?: Date;
}

export interface IReply extends Document {
  replierFid: string;
  targetFid: string;
  targetHash: string;
  replies: IReplyOption[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplyOptionSchema = new Schema<IReplyOption>(
  {
    text: { type: String, required: true },
    personalization: { type: String },
    posted: { type: Boolean, default: false },
    postedAt: { type: Date },
  },
  { _id: false }
);

const ReplySchema = new Schema<IReply>(
  {
    replierFid: { type: String, required: true, index: true },
    targetFid: { type: String, required: true, index: true },
    targetHash: { type: String, required: true, index: true },
    replies: { type: [ReplyOptionSchema], required: true, default: [] },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
ReplySchema.index({ replierFid: 1, targetFid: 1, targetHash: 1 });

const Reply: Model<IReply> =
  mongoose.models.Reply || mongoose.model<IReply>("Reply", ReplySchema);

export default Reply;
