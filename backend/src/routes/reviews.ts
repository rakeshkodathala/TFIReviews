import express, { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import ReviewLike from '../models/ReviewLike';
import Comment from '../models/Comment';
import Movie from '../models/Movie';
import User from '../models/User';
import movieApiService from '../services/movieApi';
import { IReview, IMovie, AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';
import { notifyReviewComment, notifyReviewLike } from '../services/notificationService';

const router: Router = express.Router();

interface ReviewQuery {
  page?: string;
  limit?: string;
  userId?: string;
}

// Helper function to add like count and user liked status to reviews
async function enrichReviewsWithLikes(reviews: any[], userId?: string) {
  if (reviews.length === 0) return reviews;
  
  const reviewIds = reviews.map((r: any) => new mongoose.Types.ObjectId(r._id.toString()));
  
  // Get like counts for all reviews
  const likeCounts = await ReviewLike.aggregate([
    { $match: { reviewId: { $in: reviewIds } } },
    { $group: { _id: '$reviewId', count: { $sum: 1 } } }
  ]);
  
  const likeCountMap = new Map(
    likeCounts.map((item: any) => [item._id.toString(), item.count])
  );
  
  // Get user's liked reviews if authenticated
  let userLikedReviews: string[] = [];
  if (userId) {
    const userLikes = await ReviewLike.find({ 
      userId: new mongoose.Types.ObjectId(userId), 
      reviewId: { $in: reviewIds } 
    }).lean();
    userLikedReviews = userLikes.map((like: any) => like.reviewId.toString());
  }
  
  // Enrich reviews with like data
  return reviews.map((review: any) => ({
    ...review,
    likes: likeCountMap.get(review._id.toString()) || 0,
    isLiked: userId ? userLikedReviews.includes(review._id.toString()) : false,
  }));
}

// CreateReviewBody interface removed - using req.body directly

// Get all reviews (for Activity feed)
router.get('/', async (req: Request<{}, {}, {}, ReviewQuery>, res: Response) => {
  try {
    const { page = '1', limit = '50', userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({})
      .populate('userId', 'username name avatar')
      .populate('movieId', 'title posterUrl tmdbId releaseDate')
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    const total: number = await Review.countDocuments({});
    
    // Enrich with like data
    const enrichedReviews = await enrichReviewsWithLikes(reviews, userId);

    res.json({
      reviews: enrichedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all reviews for a movie (by MongoDB ID or TMDB ID)
router.get('/movie/:movieId', async (req: Request<{ movieId: string }, {}, {}, ReviewQuery>, res: Response) => {
  try {
    const { page = '1', limit = '20', userId } = req.query;
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
    
    // Enrich with like data
    const enrichedReviews = await enrichReviewsWithLikes(reviews, userId as string | undefined);

    res.json({
      reviews: enrichedReviews,
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
    const { page = '1', limit = '20', userId } = req.query;
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
    
    // Enrich with like data
    const enrichedReviews = await enrichReviewsWithLikes(reviews, userId as string | undefined);

    res.json({
      reviews: enrichedReviews,
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
router.get('/:id', async (req: Request<{ id: string }, {}, {}, ReviewQuery>, res: Response) => {
  try {
    const { userId } = req.query;
    
    const review = await Review.findById(req.params.id)
      .populate('userId', 'username name avatar')
      .populate('movieId', 'title posterUrl tmdbId')
      .select('-__v')
      .lean();

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Enrich with like data
    const enrichedReviews = await enrichReviewsWithLikes([review], userId);
    res.json(enrichedReviews[0]);
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
      } else if (!movie.tmdbRating || movie.tmdbRating === 0) {
        // Movie exists but doesn't have TMDB rating, fetch and update it
        try {
          const externalMovie = await movieApiService.getMovieById(tmdbId);
          const tmdbRating = externalMovie.rating 
            ? Math.max(0, Math.min(10, externalMovie.rating))
            : 0;
          
          // Update TMDB rating and recalculate combined rating
          const allReviews = await Review.find({ movieId: movie._id.toString() }).lean() as unknown as IReview[];
          let combinedRating = tmdbRating;
          
          if (allReviews.length > 0) {
            const userAvgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            combinedRating = (tmdbRating + userAvgRating) / 2;
          }
          
          await Movie.findByIdAndUpdate(movie._id, {
            tmdbRating: tmdbRating,
            rating: Math.round(combinedRating * 10) / 10,
          });
        } catch (error) {
          console.error('Error fetching TMDB rating for existing movie:', error);
        }
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
    const existingReview = await Review.findOne({ movieId: dbMovieId, userId }).lean() as unknown as IReview | null;
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this movie' });
    }

    const newReview: IReview = new Review({ movieId: dbMovieId, userId, rating, title, review });
    await newReview.save();

    // Update movie rating and review count (combine TMDB rating with user reviews)
    const movie = await Movie.findById(dbMovieId).lean() as unknown as IMovie | null;
    if (movie) {
      const allReviews = await Review.find({ movieId: dbMovieId }).lean() as unknown as IReview[];
      const tmdbRating = movie.tmdbRating || 0;
      
      let combinedRating = tmdbRating; // Default to TMDB rating
      
      if (allReviews.length > 0) {
        // Calculate average of user reviews
        const userAvgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        
        // Combine TMDB rating and user reviews average
        // Simple average: (TMDB rating + user reviews average) / 2
        combinedRating = (tmdbRating + userAvgRating) / 2;
      }
      
      await Movie.findByIdAndUpdate(dbMovieId, {
        rating: Math.round(combinedRating * 10) / 10,
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
    const existingReview = await Review.findById(req.params.id).lean() as unknown as IReview | null;
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('userId', 'username name avatar')
      .select('-__v')
      .lean() as unknown as IReview | null;

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update movie rating (combine TMDB rating with user reviews)
    const movie = await Movie.findById(review.movieId).lean() as unknown as IMovie | null;
    if (movie) {
      const allReviews = await Review.find({ movieId: review.movieId }).lean() as unknown as IReview[];
      const tmdbRating = movie.tmdbRating || 0;
      
      let combinedRating = tmdbRating; // Default to TMDB rating
      
      if (allReviews.length > 0) {
        // Calculate average of user reviews
        const userAvgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        
        // Combine TMDB rating and user reviews average
        combinedRating = (tmdbRating + userAvgRating) / 2;
      }
      
      await Movie.findByIdAndUpdate(review.movieId, {
        rating: Math.round(combinedRating * 10) / 10,
        totalReviews: allReviews.length,
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
    const existingReview = await Review.findById(req.params.id).lean() as unknown as IReview | null;
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    const review = await Review.findByIdAndDelete(req.params.id).lean() as unknown as IReview | null;
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update movie rating (combine TMDB rating with user reviews)
    const movie = await Movie.findById(review.movieId).lean() as unknown as IMovie | null;
    if (movie) {
      const allReviews = await Review.find({ movieId: review.movieId }).lean() as unknown as IReview[];
      const tmdbRating = movie.tmdbRating || 0;
      
      let combinedRating = tmdbRating; // Default to TMDB rating if no reviews
      
      if (allReviews.length > 0) {
        // Calculate average of user reviews
        const userAvgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        
        // Combine TMDB rating and user reviews average
        combinedRating = (tmdbRating + userAvgRating) / 2;
      }
      
      await Movie.findByIdAndUpdate(review.movieId, {
        rating: Math.round(combinedRating * 10) / 10,
        totalReviews: allReviews.length,
      });
    }

    return res.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Like a review
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const reviewId = req.params.id;
    
    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user already liked this review
    const existingLike = await ReviewLike.findOne({ reviewId, userId });
    if (existingLike) {
      return res.status(400).json({ error: 'You have already liked this review' });
    }

    // Create like
    const like = new ReviewLike({ reviewId, userId });
    await like.save();

    // Update review likes count
    await Review.findByIdAndUpdate(reviewId, { $inc: { likes: 1 } });

    // Get updated like count
    const likeCount = await ReviewLike.countDocuments({ reviewId });

    // Send notification to review owner (if not the same user)
    const reviewOwnerId = review.userId.toString();
    if (reviewOwnerId !== userId) {
      const liker = await User.findById(userId).select('username').lean();
      const movie = await Movie.findById(review.movieId).select('title').lean();
      if (liker) {
        notifyReviewLike(
          reviewOwnerId,
          liker.username || 'Someone',
          reviewId,
          movie?.title
        ).catch((err) => console.error('Error sending like notification:', err));
      }
    }

    res.json({
      message: 'Review liked successfully',
      likes: likeCount,
      isLiked: true,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error (already liked)
      return res.status(400).json({ error: 'You have already liked this review' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Unlike a review
router.delete('/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const reviewId = req.params.id;
    
    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Remove like
    const deletedLike = await ReviewLike.findOneAndDelete({ reviewId, userId });
    if (!deletedLike) {
      return res.status(404).json({ error: 'Like not found' });
    }

    // Update review likes count (ensure it doesn't go below 0)
    await Review.findByIdAndUpdate(reviewId, { $inc: { likes: -1 } });

    // Get updated like count
    const likeCount = await ReviewLike.countDocuments({ reviewId });

    res.json({
      message: 'Review unliked successfully',
      likes: likeCount,
      isLiked: false,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get users who liked a review
router.get('/:id/likes', async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.id;
    
    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const likes = await ReviewLike.find({ reviewId })
      .populate('userId', 'username name avatar')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    res.json({
      likes: likes.map((like: any) => ({
        user: like.userId,
        createdAt: like.createdAt,
      })),
      count: likes.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments for a review
router.get('/:id/comments', async (req: Request<{ id: string }, {}, {}, { page?: string; limit?: string }>, res: Response) => {
  try {
    const reviewId = req.params.id;
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const comments = await Comment.find({ reviewId })
      .populate('userId', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    const total = await Comment.countDocuments({ reviewId });

    res.json({
      comments: comments.map((comment: any) => ({
        id: comment._id.toString(),
        reviewId: comment.reviewId.toString(),
        user: comment.userId,
        comment: comment.comment,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })),
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

// Create a comment on a review
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const reviewId = req.params.id;
    const { comment } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
    }

    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const newComment = new Comment({
      reviewId,
      userId,
      comment: comment.trim(),
    });
    await newComment.save();

    const populatedComment = await Comment.findById(newComment._id)
      .populate('userId', 'username name avatar')
      .select('-__v')
      .lean();

    // Send notification to review owner (if not the same user)
    const reviewOwnerId = review.userId.toString();
    if (reviewOwnerId !== userId) {
      const commenter = await User.findById(userId).select('username').lean();
      const movie = await Movie.findById(review.movieId).select('title').lean();
      if (commenter) {
        notifyReviewComment(
          reviewOwnerId,
          commenter.username || 'Someone',
          reviewId,
          populatedComment!._id.toString(),
          movie?.title
        ).catch((err) => console.error('Error sending comment notification:', err));
      }
    }

    res.status(201).json({
      comment: {
        id: populatedComment!._id.toString(),
        reviewId: populatedComment!.reviewId.toString(),
        user: populatedComment!.userId,
        comment: populatedComment!.comment,
        createdAt: populatedComment!.createdAt,
        updatedAt: populatedComment!.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a comment
router.put('/comments/:commentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const commentId = req.params.commentId;
    const { comment } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
    }

    // Find comment and verify ownership
    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    existingComment.comment = comment.trim();
    await existingComment.save();

    const populatedComment = await Comment.findById(commentId)
      .populate('userId', 'username name avatar')
      .select('-__v')
      .lean();

    res.json({
      comment: {
        id: populatedComment!._id.toString(),
        reviewId: populatedComment!.reviewId.toString(),
        user: populatedComment!.userId,
        comment: populatedComment!.comment,
        createdAt: populatedComment!.createdAt,
        updatedAt: populatedComment!.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a comment
router.delete('/comments/:commentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const commentId = req.params.commentId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find comment and verify ownership
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
