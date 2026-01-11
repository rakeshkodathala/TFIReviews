import express, { Router, Request, Response } from 'express';
import movieApiService from '../services/movieApi';
import Movie from '../models/Movie';
import { MovieSearchParams } from '../services/movieApi';

const router: Router = express.Router();

/**
 * Search movies from external API
 * GET /api/movie-search/search?query=bahubali&year=2015
 */
router.get('/search', async (req: Request<{}, {}, {}, MovieSearchParams>, res: Response) => {
  try {
    const { query, year, page, language, ...otherParams } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const searchParams: MovieSearchParams = {
      query,
      year: year ? parseInt(year as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      language: language || 'te', // Telugu by default
      ...otherParams,
    };

    const movies = await movieApiService.searchMovies(searchParams);
    
    res.json({
      movies,
      count: movies.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get movie details from external API by ID
 * GET /api/movie-search/movie/:externalId
 */
router.get('/movie/:externalId', async (req: Request, res: Response) => {
  try {
    const { externalId } = req.params;
    const movie = await movieApiService.getMovieById(externalId);
    
    res.json(movie);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get popular/trending movies from TMDB
 * GET /api/movie-search/popular
 */
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const movies = await movieApiService.getPopularMovies(req.query);
    
    res.json({
      movies,
      count: movies.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Tollywood/Regional movies (Telugu movies from India)
 * GET /api/movie-search/tollywood?page=1
 */
router.get('/tollywood', async (req: Request, res: Response) => {
  try {
    const movies = await movieApiService.getMoviesByRegion('IN', {
      language: 'en', // Use English to get English titles
      ...req.query,
    });
    
    res.json({
      movies,
      count: movies.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get movies by genre using TMDB discover API
 * GET /api/movie-search/genre/:genreId?page=1
 */
router.get('/genre/:genreId', async (req: Request, res: Response) => {
  try {
    const { genreId } = req.params;
    const { page = '1', language = 'te' } = req.query;
    
    const movies = await movieApiService.getMoviesByGenre(parseInt(genreId), {
      page: parseInt(page as string),
      language: language as string,
    });
    
    res.json({
      movies,
      count: movies.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Import movie from external API to our database
 * POST /api/movie-search/import/:externalId
 */
router.post('/import/:externalId', async (req: Request, res: Response) => {
  try {
    const { externalId } = req.params;
    
    // Fetch movie from external API
    const externalMovie = await movieApiService.getMovieById(externalId);
    
    // Check if movie already exists in our database (by TMDB ID or title+date)
    const existingMovie = await Movie.findOne({ 
      $or: [
        { tmdbId: externalMovie.tmdbId || externalMovie.id },
        { 
          title: externalMovie.title,
          releaseDate: externalMovie.releaseDate ? new Date(externalMovie.releaseDate) : undefined,
        }
      ]
    });
    
    if (existingMovie) {
      return res.status(400).json({ 
        error: 'Movie already exists in database',
        movie: existingMovie,
      });
    }
    
    // Convert to our database format and save
    const movieData = movieApiService.convertToDbFormat(externalMovie);
    const movie = new Movie(movieData);
    await movie.save();
    
    res.status(201).json({
      message: 'Movie imported successfully',
      movie,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
