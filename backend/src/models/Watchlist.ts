import mongoose, { Schema, Model } from 'mongoose';

export interface IWatchlist extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  movieId?: mongoose.Types.ObjectId;
  tmdbId?: number;
  addedAt: Date;
}

const watchlistSchema = new Schema<IWatchlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
    },
    tmdbId: {
      type: Number,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure user can't add same movie twice
watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true, sparse: true });
watchlistSchema.index({ userId: 1, tmdbId: 1 }, { unique: true, sparse: true });

const Watchlist: Model<IWatchlist> = mongoose.model<IWatchlist>('Watchlist', watchlistSchema);

export default Watchlist;
