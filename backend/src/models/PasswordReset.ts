import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPasswordReset extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
        used: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster lookups
passwordResetSchema.index({ email: 1, otp: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired documents

const PasswordReset: Model<IPasswordReset> = mongoose.model<IPasswordReset>(
    'PasswordReset',
    passwordResetSchema
);

export default PasswordReset;
