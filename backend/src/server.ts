import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection (skip in test environment - handled by test setup)
const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/tfireviews';

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    })
    .then(() => {
      console.log('✅ Connected to MongoDB');
      console.log(`📊 Database: ${MONGODB_URI.split('/').pop()}`);
    })
    .catch((err: Error) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.error('💡 Make sure MongoDB is running: brew services start mongodb-community (macOS)');
      console.error('💡 Or check your MONGODB_URI in .env file');
    });
}

// Routes
import moviesRouter from './routes/movies';
import reviewsRouter from './routes/reviews';
import authRouter from './routes/auth';
import movieSearchRouter from './routes/movieSearch';
import watchlistRouter from './routes/watchlist';
import usersRouter from './routes/users';

app.use('/api/movies', moviesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/auth', authRouter);
app.use('/api/movie-search', movieSearchRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'TFI Reviews API is running' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Only start server if this file is run directly (not in tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export app for testing
export default app;
