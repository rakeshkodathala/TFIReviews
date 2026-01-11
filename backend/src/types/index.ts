import { Document } from 'mongoose';
import { Request } from 'express';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  name?: string;
  avatar?: string;
  location?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IMovie extends Document {
  _id: string;
  title: string;
  titleTelugu?: string;
  director: string;
  cast: string[];
  releaseDate: Date;
  genre: string[];
  posterUrl?: string;
  trailerUrl?: string;
  synopsis?: string;
  rating: number;
  totalReviews: number;
  tmdbId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends Document {
  _id: string;
  movieId: string;
  userId: string;
  rating: number;
  title?: string;
  review: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  userId?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  genre?: string;
  sortBy?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
