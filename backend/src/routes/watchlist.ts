import express, { Router, Response } from 'express';
import Watchlist from '../models/Watchlist';
import Movie from '../models/Movie';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

// Get user's watchlist
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const watchlistItems = await Watchlist.find({ userId })
      .populate('movieId', 'title posterUrl tmdbId releaseDate')
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .select('-__v')
      .lean();

    const total = await Watchlist.countDocuments({ userId });

    res.json({
      watchlist: watchlistItems,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get watchlist count
router.get('/count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const count = await Watchlist.countDocuments({ userId });

    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add movie to watchlist
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { movieId, tmdbId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!movieId && !tmdbId) {
      return res.status(400).json({ error: 'movieId or tmdbId is required' });
    }

    // If tmdbId is provided, find or create movie
    let dbMovieId = movieId;
    if (tmdbId && !movieId) {
      let movie = await Movie.findOne({ tmdbId: parseInt(tmdbId) });
      if (!movie) {
        // Movie doesn't exist in DB yet, just store tmdbId
        const existingItem = await Watchlist.findOne({ userId, tmdbId: parseInt(tmdbId) });
        if (existingItem) {
          return res.status(400).json({ error: 'Movie already in watchlist' });
        }

        const newItem = new Watchlist({
          userId,
          tmdbId: parseInt(tmdbId),
        });
        await newItem.save();
        return res.json({ message: 'Movie added to watchlist', watchlistItem: newItem });
      }
      dbMovieId = movie._id.toString();
    }

    // Check if already in watchlist
    const existingItem = await Watchlist.findOne({ userId, movieId: dbMovieId });
    if (existingItem) {
      return res.status(400).json({ error: 'Movie already in watchlist' });
    }

    const watchlistItem = new Watchlist({
      userId,
      movieId: dbMovieId,
      tmdbId: tmdbId ? parseInt(tmdbId) : undefined,
    });

    await watchlistItem.save();

    const populatedItem = await Watchlist.findById(watchlistItem._id)
      .populate('movieId', 'title posterUrl tmdbId releaseDate')
      .select('-__v')
      .lean();

    res.status(201).json({ message: 'Movie added to watchlist', watchlistItem: populatedItem });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Movie already in watchlist' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Remove movie from watchlist
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const item = await Watchlist.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    await Watchlist.findByIdAndDelete(id);

    res.json({ message: 'Movie removed from watchlist' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check if movie is in watchlist
router.get('/check', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { movieId, tmdbId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let query: any = { userId };
    if (movieId) {
      query.movieId = movieId;
    } else if (tmdbId) {
      query.tmdbId = parseInt(tmdbId as string);
    } else {
      return res.status(400).json({ error: 'movieId or tmdbId is required' });
    }

    const item = await Watchlist.findOne(query);
    res.json({ inWatchlist: !!item, watchlistItem: item });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
