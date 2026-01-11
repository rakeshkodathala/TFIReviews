import mongoose, { Schema, Model } from 'mongoose';
import { IMovie } from '../types';

const movieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleTelugu: {
      type: String,
      trim: true,
    },
    director: {
      type: String,
      required: true,
    },
    cast: [
      {
        type: String,
      },
    ],
    releaseDate: {
      type: Date,
      required: true,
    },
    genre: [
      {
        type: String,
      },
    ],
    posterUrl: {
      type: String,
    },
    trailerUrl: {
      type: String,
    },
    synopsis: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    tmdbRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    tmdbId: {
      type: Number,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
    },
  },
  {
    timestamps: true,
  }
);

movieSchema.index({ title: 'text', titleTelugu: 'text', director: 'text' });

const Movie: Model<IMovie> = mongoose.model<IMovie>('Movie', movieSchema);

export default Movie;
