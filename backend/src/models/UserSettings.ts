import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  // Display Settings
  darkMode: boolean;
  // Content Settings
  autoPlayTrailers: boolean;
  // Notification Preferences
  reviewNotifications: boolean;
  newMovieNotifications: boolean;
  watchlistNotifications: boolean;
  weeklyDigest: boolean;
  // Privacy Settings
  profilePublic: boolean;
  watchlistPublic: boolean;
  showEmail: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    } as any,
    // Display Settings
    darkMode: {
      type: Boolean,
      default: true,
    },
    // Content Settings
    autoPlayTrailers: {
      type: Boolean,
      default: false,
    },
    // Notification Preferences
    reviewNotifications: {
      type: Boolean,
      default: true,
    },
    newMovieNotifications: {
      type: Boolean,
      default: true,
    },
    watchlistNotifications: {
      type: Boolean,
      default: false,
    },
    weeklyDigest: {
      type: Boolean,
      default: true,
    },
    // Privacy Settings
    profilePublic: {
      type: Boolean,
      default: true,
    },
    watchlistPublic: {
      type: Boolean,
      default: true,
    },
    showEmail: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one settings document per user
userSettingsSchema.index({ userId: 1 }, { unique: true });

const UserSettings: Model<IUserSettings> = mongoose.model<IUserSettings>(
  'UserSettings',
  userSettingsSchema
);

export default UserSettings;
