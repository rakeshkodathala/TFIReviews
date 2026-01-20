import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IFollow extends Document {
    followerId: mongoose.Types.ObjectId; // User who is following
    followingId: mongoose.Types.ObjectId; // User being followed
    createdAt: Date;
}

const followSchema = new Schema<IFollow>(
    {
        followerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        } as any,
        followingId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        } as any,
    },
    {
        timestamps: true,
    }
);

// Prevent self-following
followSchema.pre('save', function (next) {
    if (this.followerId.toString() === this.followingId.toString()) {
        const error = new Error('Cannot follow yourself');
        return next(error);
    }
    next();
});

// Ensure one follow relationship per user pair
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followerId: 1 });
followSchema.index({ followingId: 1 });

const Follow: Model<IFollow> = mongoose.model<IFollow>('Follow', followSchema);

export default Follow;
