import request from 'supertest';
import app from '../../../src/server';
import Movie from '../../../src/models/Movie';
import movieApiService from '../../../src/services/movieApi';

// Mock the movieApiService
jest.mock('../../../src/services/movieApi');

describe('MovieSearch Routes', () => {
  const mockMovieApiService = movieApiService as jest.Mocked<typeof movieApiService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/movie-search/search', () => {
    it('should search movies with query parameter', async () => {
      const mockMovies = [
        {
          id: 12345,
          title: 'Test Movie',
          director: 'Test Director',
          cast: ['Actor 1'],
          releaseDate: '2024-01-01',
          genre: ['Action'],
          posterUrl: 'https://example.com/poster.jpg',
        },
      ];

      mockMovieApiService.searchMovies.mockResolvedValue(mockMovies as any);

      const response = await request(app)
        .get('/api/movie-search/search?query=test')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('count', 1);
      expect(Array.isArray(response.body.movies)).toBe(true);
      expect(mockMovieApiService.searchMovies).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
        })
      );
    });

    it('should require query parameter', async () => {
      const response = await request(app)
        .get('/api/movie-search/search')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query parameter is required');
      expect(mockMovieApiService.searchMovies).not.toHaveBeenCalled();
    });

    it('should support year parameter', async () => {
      const mockMovies: any[] = [];
      mockMovieApiService.searchMovies.mockResolvedValue(mockMovies);

      await request(app)
        .get('/api/movie-search/search?query=test&year=2024')
        .expect(200);

      expect(mockMovieApiService.searchMovies).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          year: 2024,
        })
      );
    });

    it('should support page parameter', async () => {
      const mockMovies: any[] = [];
      mockMovieApiService.searchMovies.mockResolvedValue(mockMovies);

      await request(app)
        .get('/api/movie-search/search?query=test&page=2')
        .expect(200);

      expect(mockMovieApiService.searchMovies).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          page: 2,
        })
      );
    });

    it('should support language parameter', async () => {
      const mockMovies: any[] = [];
      mockMovieApiService.searchMovies.mockResolvedValue(mockMovies);

      await request(app)
        .get('/api/movie-search/search?query=test&language=en')
        .expect(200);

      expect(mockMovieApiService.searchMovies).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          language: 'en',
        })
      );
    });

    it('should default to Telugu language', async () => {
      const mockMovies: any[] = [];
      mockMovieApiService.searchMovies.mockResolvedValue(mockMovies);

      await request(app)
        .get('/api/movie-search/search?query=test')
        .expect(200);

      expect(mockMovieApiService.searchMovies).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          language: 'te',
        })
      );
    });

    it('should handle API errors', async () => {
      mockMovieApiService.searchMovies.mockRejectedValue(
        new Error('API request failed')
      );

      const response = await request(app)
        .get('/api/movie-search/search?query=test')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/movie-search/movie/:externalId', () => {
    it('should get movie details by external ID', async () => {
      const mockMovie = {
        id: 12345,
        title: 'Test Movie',
        director: 'Test Director',
        cast: ['Actor 1'],
        releaseDate: '2024-01-01',
        genre: ['Action'],
        posterUrl: 'https://example.com/poster.jpg',
        synopsis: 'A test movie',
      };

      mockMovieApiService.getMovieById.mockResolvedValue(mockMovie as any);

      const response = await request(app)
        .get('/api/movie-search/movie/12345')
        .expect(200);

      expect(response.body).toHaveProperty('id', 12345);
      expect(response.body).toHaveProperty('title', 'Test Movie');
      expect(mockMovieApiService.getMovieById).toHaveBeenCalledWith('12345');
    });

    it('should handle API errors', async () => {
      mockMovieApiService.getMovieById.mockRejectedValue(
        new Error('Movie not found')
      );

      const response = await request(app)
        .get('/api/movie-search/movie/99999')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/movie-search/popular', () => {
    it('should get popular movies', async () => {
      const mockMovies = [
        {
          id: 1,
          title: 'Popular Movie 1',
        },
        {
          id: 2,
          title: 'Popular Movie 2',
        },
      ];

      mockMovieApiService.getPopularMovies.mockResolvedValue(mockMovies as any);

      const response = await request(app)
        .get('/api/movie-search/popular')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('count', 2);
      expect(Array.isArray(response.body.movies)).toBe(true);
      expect(mockMovieApiService.getPopularMovies).toHaveBeenCalled();
    });

    it('should support query parameters', async () => {
      const mockMovies: any[] = [];
      mockMovieApiService.getPopularMovies.mockResolvedValue(mockMovies);

      await request(app)
        .get('/api/movie-search/popular?page=2&language=en')
        .expect(200);

      expect(mockMovieApiService.getPopularMovies).toHaveBeenCalledWith(
        expect.objectContaining({
          page: '2',
          language: 'en',
        })
      );
    });

    it('should handle API errors', async () => {
      mockMovieApiService.getPopularMovies.mockRejectedValue(
        new Error('API request failed')
      );

      const response = await request(app)
        .get('/api/movie-search/popular')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/movie-search/tollywood', () => {
    it('should get Tollywood movies', async () => {
      const mockMovies = [
        {
          id: 1,
          title: 'Tollywood Movie 1',
        },
      ];

      mockMovieApiService.getMoviesByRegion.mockResolvedValue(mockMovies as any);

      const response = await request(app)
        .get('/api/movie-search/tollywood')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('count', 1);
      expect(mockMovieApiService.getMoviesByRegion).toHaveBeenCalledWith(
        'IN',
        expect.objectContaining({
          language: 'en',
        })
      );
    });

    it('should support query parameters', async () => {
      const mockMovies: any[] = [];
      mockMovieApiService.getMoviesByRegion.mockResolvedValue(mockMovies);

      await request(app)
        .get('/api/movie-search/tollywood?page=2')
        .expect(200);

      expect(mockMovieApiService.getMoviesByRegion).toHaveBeenCalledWith(
        'IN',
        expect.objectContaining({
          language: 'en',
          page: '2',
        })
      );
    });

    it('should handle API errors', async () => {
      mockMovieApiService.getMoviesByRegion.mockRejectedValue(
        new Error('API request failed')
      );

      const response = await request(app)
        .get('/api/movie-search/tollywood')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/movie-search/genre/:genreId', () => {
    it('should get movies by genre', async () => {
      const mockMovies = [
        {
          id: 1,
          title: 'Action Movie',
        },
      ];

      mockMovieApiService.getMoviesByGenre.mockResolvedValue(mockMovies as any);

      const response = await request(app)
        .get('/api/movie-search/genre/28')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('count', 1);
      expect(mockMovieApiService.getMoviesByGenre).toHaveBeenCalledWith(
        28,
        expect.objectContaining({
          page: 1,
          language: 'te',
        })
      );
    });

    it('should support query parameters', async () => {
      const mockMovies: any[] = [];
      mockMovieApiService.getMoviesByGenre.mockResolvedValue(mockMovies);

      await request(app)
        .get('/api/movie-search/genre/28?page=2&language=en')
        .expect(200);

      expect(mockMovieApiService.getMoviesByGenre).toHaveBeenCalledWith(
        28,
        expect.objectContaining({
          page: 2,
          language: 'en',
        })
      );
    });

    it('should handle API errors', async () => {
      mockMovieApiService.getMoviesByGenre.mockRejectedValue(
        new Error('API request failed')
      );

      const response = await request(app)
        .get('/api/movie-search/genre/28')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/movie-search/person/:personId', () => {
    it('should get person details', async () => {
      const mockPerson = {
        id: 123,
        name: 'Test Actor',
        biography: 'A test actor',
        profile_path: '/path/to/profile.jpg',
      };

      mockMovieApiService.getPersonById.mockResolvedValue(mockPerson as any);

      const response = await request(app)
        .get('/api/movie-search/person/123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 123);
      expect(response.body).toHaveProperty('name', 'Test Actor');
      expect(mockMovieApiService.getPersonById).toHaveBeenCalledWith('123');
    });

    it('should handle API errors', async () => {
      mockMovieApiService.getPersonById.mockRejectedValue(
        new Error('Person not found')
      );

      const response = await request(app)
        .get('/api/movie-search/person/99999')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/movie-search/import/:externalId', () => {
    it('should import movie to database', async () => {
      const mockExternalMovie = {
        id: 12345,
        title: 'New Movie',
        director: 'New Director',
        cast: ['Actor 1'],
        releaseDate: '2024-01-01',
        genre: ['Action'],
        posterUrl: 'https://example.com/poster.jpg',
        synopsis: 'A new movie',
        rating: 8.5,
      };

      mockMovieApiService.getMovieById.mockResolvedValue(mockExternalMovie as any);
      mockMovieApiService.convertToDbFormat.mockReturnValue({
        title: 'New Movie',
        director: 'New Director',
        cast: ['Actor 1'],
        releaseDate: new Date('2024-01-01'),
        genre: ['Action'],
        posterUrl: 'https://example.com/poster.jpg',
        synopsis: 'A new movie',
        rating: 8.5,
        tmdbRating: 8.5,
        totalReviews: 0,
        tmdbId: 12345,
      } as any);

      const response = await request(app)
        .post('/api/movie-search/import/12345')
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Movie imported successfully');
      expect(response.body).toHaveProperty('movie');
      expect(response.body.movie.title).toBe('New Movie');

      // Verify in database
      const movie = await Movie.findOne({ tmdbId: 12345 });
      expect(movie).toBeTruthy();
      expect(movie?.title).toBe('New Movie');
    });

    it('should prevent importing duplicate movies', async () => {
      // Create existing movie
      const existingMovie = new Movie({
        title: 'Existing Movie',
        director: 'Director',
        cast: ['Actor'],
        releaseDate: new Date('2024-01-01'),
        genre: ['Action'],
        tmdbId: 12345,
      });
      await existingMovie.save();

      const mockExternalMovie = {
        id: 12345,
        title: 'Existing Movie',
        releaseDate: '2024-01-01',
      };

      mockMovieApiService.getMovieById.mockResolvedValue(mockExternalMovie as any);

      const response = await request(app)
        .post('/api/movie-search/import/12345')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Movie already exists in database');
    });

    it('should handle API errors', async () => {
      mockMovieApiService.getMovieById.mockRejectedValue(
        new Error('Movie not found')
      );

      const response = await request(app)
        .post('/api/movie-search/import/99999')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
