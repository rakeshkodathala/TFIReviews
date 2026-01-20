import express, { Router, Request, Response } from 'express';
import Movie from '../models/Movie';
import { PaginationQuery, IMovie, AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

// Get all movies
router.get('/', async (req: Request<{}, {}, {}, PaginationQuery>, res: Response) => {
  try {
    const { page = '1', limit = '20', search, genre, sortBy = 'releaseDate' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query: any = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (genre) {
      query.genre = { $in: [genre] };
    }

    const movies = await Movie.find(query)
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean() as unknown as IMovie[];

    const total: number = await Movie.countDocuments(query);

    const response = {
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get single movie by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const movie = await Movie.findById(req.params.id).select('-__v').lean() as unknown as IMovie | null;
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    return res.json(movie);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create new movie (requires authentication)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const movie: IMovie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update movie (requires authentication)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .select('-__v')
      .lean() as unknown as IMovie | null;

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    return res.json(movie);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Delete movie (requires authentication)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id).lean() as unknown as IMovie | null;
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    return res.json({ message: 'Movie deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
