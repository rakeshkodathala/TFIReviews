import mongoose, { Schema, Model, Document } from 'mongoose';

export type NotificationType =
  | 'review_comment'
  | 'review_like'
  | 'new_follower'
  | 'new_movie'
  | 'watchlist_update'
  | 'weekly_digest';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    reviewId?: string;
    commentId?: string;
    movieId?: string;
    followerId?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    } as any,
    type: {
      type: String,
      enum: [
        'review_comment',
        'review_like',
        'new_follower',
        'new_movie',
        'watchlist_update',
        'weekly_digest',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

export default Notification;
