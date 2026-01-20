import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IReviewLike extends Document {
  reviewId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const reviewLikeSchema = new Schema<IReviewLike>(
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
  },
  {
    timestamps: true,
  }
);

// Ensure one like per user per review
reviewLikeSchema.index({ reviewId: 1, userId: 1 }, { unique: true });
reviewLikeSchema.index({ reviewId: 1 });
reviewLikeSchema.index({ userId: 1 });

const ReviewLike: Model<IReviewLike> = mongoose.model<IReviewLike>('ReviewLike', reviewLikeSchema);

export default ReviewLike;
