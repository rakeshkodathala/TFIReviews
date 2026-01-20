import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IComment extends Document {
  reviewId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    } as any,
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    } as any,
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
commentSchema.index({ reviewId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });

const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
