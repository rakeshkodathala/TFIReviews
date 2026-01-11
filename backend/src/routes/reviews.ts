import express, { Router, Request, Response } from 'express';
import Review from '../models/Review';
import Movie from '../models/Movie';
import movieApiService from '../services/movieApi';
import { IReview, IMovie, AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

interface ReviewQuery {
  page?: string;
  limit?: string;
}

interface CreateReviewBody {
  movieId?: string; // MongoDB movie ID
  tmdbId?: string | number; // TMDB movie ID (alternative)
  rating: number;
  title?: string;
  review: string;
}

// Get all reviews for a movie (by MongoDB ID or TMDB ID)
router.get('/movie/:movieId', async (req: Request<{ movieId: string }, {}, {}, ReviewQuery>, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const { movieId } = req.params;

    // Check if movieId is a MongoDB ObjectId or TMDB ID
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(movieId);
    
    let query: any = {};
    
    if (isMongoId) {
      // MongoDB ID - find reviews directly
      query.movieId = movieId;
    } else {
      // TMDB ID - find movie in DB first, then get reviews
      const movie = await Movie.findOne({ tmdbId: parseInt(movieId) });
      if (!movie) {
        return res.json({
          reviews: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        });
      }
      query.movieId = movie._id.toString();
    }

    const reviews = await Review.find(query)
      .populate('userId', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    const total: number = await Review.countDocuments(query);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews by TMDB ID
router.get('/tmdb/:tmdbId', async (req: Request<{ tmdbId: string }, {}, {}, ReviewQuery>, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const { tmdbId } = req.params;

    // Find movie by TMDB ID
    const movie = await Movie.findOne({ tmdbId: parseInt(tmdbId) });
    
    if (!movie) {
      return res.json({
        reviews: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
        },
      });
    }

    const reviews = await Review.find({ movieId: movie._id })
      .populate('userId', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    const total: number = await Review.countDocuments({ movieId: movie._id });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single review
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('userId', 'username name avatar')
      .populate('movieId', 'title posterUrl tmdbId')
      .select('-__v')
      .lean();

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new review (supports both MongoDB ID and TMDB ID)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { movieId, tmdbId, rating, title, review } = req.body;
    const userId = req.userId; // Get from authenticated token
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let dbMovieId: string;

    // If TMDB ID provided, auto-import movie if not exists
    if (tmdbId) {
      let movie = await Movie.findOne({ tmdbId: parseInt(tmdbId as string) });
      
      if (!movie) {
        // Auto-import movie from TMDB
        const externalMovie = await movieApiService.getMovieById(tmdbId);
        const movieData = movieApiService.convertToDbFormat(externalMovie);
        movie = new Movie(movieData);
        await movie.save();
      }
      
      dbMovieId = movie._id.toString();
    } else if (movieId) {
      // Use provided MongoDB ID
      const movie = await Movie.findById(movieId);
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      dbMovieId = movieId;
    } else {
      return res.status(400).json({ error: 'Either movieId or tmdbId is required' });
    }

    // Check if user already reviewed this movie
    const existingReview: IReview | null = await Review.findOne({ movieId: dbMovieId, userId }).lean();
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this movie' });
    }

    const newReview: IReview = new Review({ movieId: dbMovieId, userId, rating, title, review });
    await newReview.save();

    // Update movie rating and review count
    const movie: IMovie | null = await Movie.findById(dbMovieId).lean();
    if (movie) {
      const allReviews: IReview[] = await Review.find({ movieId: dbMovieId }).lean();
      const avgRating: number = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await Movie.findByIdAndUpdate(dbMovieId, {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      });
    }

    const populatedReview = await Review.findById(newReview._id)
      .populate('userId', 'username name avatar')
      .populate('movieId', 'title posterUrl tmdbId')
      .select('-__v')
      .lean();

    res.status(201).json(populatedReview);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update review
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if review exists and belongs to user
    const existingReview: IReview | null = await Review.findById(req.params.id).lean();
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }

    const review: IReview | null = await Review.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('userId', 'username name avatar')
      .select('-__v')
      .lean();

    // Update movie rating
    const movie: IMovie | null = await Movie.findById(review.movieId).lean();
    if (movie) {
      const allReviews: IReview[] = await Review.find({ movieId: review.movieId }).lean();
      const avgRating: number = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await Movie.findByIdAndUpdate(review.movieId, {
        rating: Math.round(avgRating * 10) / 10,
      });
    }

    res.json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete review
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if review exists and belongs to user
    const existingReview: IReview | null = await Review.findById(req.params.id).lean();
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    const review: IReview | null = await Review.findByIdAndDelete(req.params.id).lean();

    // Update movie rating
    const movie: IMovie | null = await Movie.findById(review.movieId).lean();
    if (movie) {
      const allReviews: IReview[] = await Review.find({ movieId: review.movieId }).lean();
      if (allReviews.length > 0) {
        const avgRating: number = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await Movie.findByIdAndUpdate(review.movieId, {
          rating: Math.round(avgRating * 10) / 10,
        });
      } else {
        await Movie.findByIdAndUpdate(review.movieId, {
          rating: 0,
        });
      }
      
      await Movie.findByIdAndUpdate(review.movieId, {
        totalReviews: allReviews.length,
      });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
