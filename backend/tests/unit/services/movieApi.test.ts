import axios from 'axios';
import { ExternalMovie, MovieSearchParams } from '../../../src/services/movieApi';

// Create a shared mock axios instance that will be used by all tests
const mockAxiosInstance = {
  get: jest.fn(),
};

// Mock axios before importing the service
jest.mock('axios', () => {
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
    create: jest.fn(() => mockAxiosInstance),
  };
});

describe('MovieApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // Reset modules to get fresh service instance
    
    // Ensure axios.create returns our mock instance
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
  });

  describe('searchMovies', () => {
    it('should search movies with query', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 12345,
              title: 'Test Movie',
              release_date: '2024-01-01',
              overview: 'A test movie',
              poster_path: '/poster.jpg',
              vote_average: 8.5,
            },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const service = require('../../../src/services/movieApi').default;
      const result = await service.searchMovies({ query: 'test' });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/search/movie',
        expect.objectContaining({
          params: expect.objectContaining({
            query: 'test',
          }),
        })
      );
    });

    it('should require query parameter', async () => {
      const service = require('../../../src/services/movieApi').default;
      await expect(service.searchMovies({} as MovieSearchParams)).rejects.toThrow(
        'Query parameter is required'
      );
    });

    it('should support year parameter', async () => {
      const mockResponse = { data: { results: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const service = require('../../../src/services/movieApi').default;
      await service.searchMovies({ query: 'test', year: 2024 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/search/movie',
        expect.objectContaining({
          params: expect.objectContaining({
            query: 'test',
            year: 2024,
          }),
        })
      );
    });

    it('should support page parameter', async () => {
      const mockResponse = { data: { results: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const service = require('../../../src/services/movieApi').default;
      await service.searchMovies({ query: 'test', page: 2 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/search/movie',
        expect.objectContaining({
          params: expect.objectContaining({
            query: 'test',
            page: 2,
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const service = require('../../../src/services/movieApi').default;
      await expect(service.searchMovies({ query: 'test' })).rejects.toThrow(
        'Failed to search movies'
      );
    });
  });

  describe('getMovieById', () => {
    it('should get movie details by ID', async () => {
      const mockMovieResponse = {
        data: {
          id: 12345,
          title: 'Test Movie',
          release_date: '2024-01-01',
          overview: 'A test movie',
          poster_path: '/poster.jpg',
          vote_average: 8.5,
        },
      };

      const mockCreditsResponse = {
        data: {
          cast: [
            { name: 'Actor 1', character: 'Character 1' },
          ],
          crew: [
            { name: 'Director 1', job: 'Director' },
          ],
        },
      };

      const mockVideosResponse = {
        data: {
          results: [
            { key: 'abc123', type: 'Trailer', site: 'YouTube' },
          ],
        },
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce(mockMovieResponse)
        .mockResolvedValueOnce(mockCreditsResponse)
        .mockResolvedValueOnce(mockVideosResponse);

      const service = require('../../../src/services/movieApi').default;
      const result = await service.getMovieById('12345');

      expect(result).toBeDefined();
      expect(result.id).toBe(12345);
      expect(result.title).toBe('Test Movie');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should handle missing credits gracefully', async () => {
      const mockMovieResponse = {
        data: {
          id: 12345,
          title: 'Test Movie',
        },
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce(mockMovieResponse)
        .mockRejectedValueOnce(new Error('Credits not found'))
        .mockResolvedValueOnce({ data: { results: [] } });

      const service = require('../../../src/services/movieApi').default;
      const result = await service.getMovieById('12345');

      expect(result).toBeDefined();
      expect(result.id).toBe(12345);
    });

    it('should handle missing videos gracefully', async () => {
      const mockMovieResponse = {
        data: {
          id: 12345,
          title: 'Test Movie',
        },
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce(mockMovieResponse)
        .mockResolvedValueOnce({ data: { cast: [], crew: [] } })
        .mockRejectedValueOnce(new Error('Videos not found'));

      const service = require('../../../src/services/movieApi').default;
      const result = await service.getMovieById('12345');

      expect(result).toBeDefined();
      expect(result.id).toBe(12345);
    });

    it('should handle API errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Movie not found'));

      const service = require('../../../src/services/movieApi').default;
      await expect(service.getMovieById('99999')).rejects.toThrow(
        'Failed to fetch movie'
      );
    });
  });

  describe('getPopularMovies', () => {
    it('should get popular movies', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 1,
              title: 'Popular Movie 1',
            },
            {
              id: 2,
              title: 'Popular Movie 2',
            },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const service = require('../../../src/services/movieApi').default;
      const result = await service.getPopularMovies();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/movie/popular',
        expect.any(Object)
      );
    });

    it('should support parameters', async () => {
      const mockResponse = { data: { results: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const service = require('../../../src/services/movieApi').default;
      await service.getPopularMovies({ page: 2, language: 'en' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/movie/popular',
        expect.objectContaining({
          params: expect.objectContaining({
            page: 2,
            language: 'en',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API error'));

      const service = require('../../../src/services/movieApi').default;
      await expect(service.getPopularMovies()).rejects.toThrow(
        'Failed to fetch popular movies'
      );
    });
  });

  describe('getMoviesByRegion', () => {
    it('should get movies by region', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 1,
              title: 'Regional Movie',
            },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const service = require('../../../src/services/movieApi').default;
      const result = await service.getMoviesByRegion('IN');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/discover/movie',
        expect.objectContaining({
          params: expect.objectContaining({
            region: 'IN',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API error'));

      const service = require('../../../src/services/movieApi').default;
      await expect(service.getMoviesByRegion('IN')).rejects.toThrow(
        'Failed to fetch regional movies'
      );
    });
  });

  describe('getMoviesByGenre', () => {
    it('should get movies by genre', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 1,
              title: 'Action Movie',
            },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const service = require('../../../src/services/movieApi').default;
      const result = await service.getMoviesByGenre(28);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/discover/movie',
        expect.objectContaining({
          params: expect.objectContaining({
            with_genres: 28,
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API error'));

      const service = require('../../../src/services/movieApi').default;
      await expect(service.getMoviesByGenre(28)).rejects.toThrow();
    });
  });

  describe('getPersonById', () => {
    it('should get person details', async () => {
      const mockResponse = {
        data: {
          id: 123,
          name: 'Test Actor',
          biography: 'A test actor',
          profile_path: '/path/to/profile.jpg',
          known_for_department: 'Acting',
          popularity: 10.5,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const service = require('../../../src/services/movieApi').default;
      const result = await service.getPersonById('123');

      expect(result).toBeDefined();
      expect(result.id).toBe(123);
      expect(result.name).toBe('Test Actor');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/person/123',
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Person not found'));

      const service = require('../../../src/services/movieApi').default;
      await expect(service.getPersonById('99999')).rejects.toThrow();
    });
  });

  describe('convertToDbFormat', () => {
    it('should convert external movie to database format', () => {
      const externalMovie: ExternalMovie = {
        id: 12345,
        title: 'Test Movie',
        director: 'Test Director',
        cast: ['Actor 1', 'Actor 2'],
        releaseDate: '2024-01-01',
        genre: ['Action', 'Drama'],
        posterUrl: 'https://example.com/poster.jpg',
        trailerUrl: 'https://youtube.com/watch?v=123',
        synopsis: 'A test movie',
        rating: 8.5,
      };

      const service = require('../../../src/services/movieApi').default;
      const result = service.convertToDbFormat(externalMovie);

      expect(result).toHaveProperty('title', 'Test Movie');
      expect(result).toHaveProperty('director', 'Test Director');
      expect(result).toHaveProperty('cast');
      expect(Array.isArray(result.cast)).toBe(true);
      expect(result).toHaveProperty('releaseDate');
      expect(result).toHaveProperty('genre');
      expect(result).toHaveProperty('rating');
      expect(result.rating).toBeGreaterThanOrEqual(0);
      expect(result.rating).toBeLessThanOrEqual(10);
    });

    it('should handle missing optional fields', () => {
      const externalMovie: ExternalMovie = {
        id: 12345,
        title: 'Test Movie',
        director: 'Test Director',
        cast: [],
        releaseDate: '2024-01-01',
        genre: [],
      };

      const service = require('../../../src/services/movieApi').default;
      const result = service.convertToDbFormat(externalMovie);

      expect(result).toHaveProperty('title', 'Test Movie');
      expect(result).toHaveProperty('cast');
      expect(Array.isArray(result.cast)).toBe(true);
      expect(result.cast.length).toBe(0);
    });

    it('should clamp rating to 0-10 range', () => {
      const externalMovie: ExternalMovie = {
        id: 12345,
        title: 'Test Movie',
        director: 'Test Director',
        cast: [],
        releaseDate: '2024-01-01',
        rating: 15, // Invalid: > 10
      };

      const service = require('../../../src/services/movieApi').default;
      const result = service.convertToDbFormat(externalMovie);

      expect(result.rating).toBe(10);
    });

    it('should handle negative rating', () => {
      const externalMovie: ExternalMovie = {
        id: 12345,
        title: 'Test Movie',
        director: 'Test Director',
        cast: [],
        releaseDate: '2024-01-01',
        rating: -5, // Invalid: < 0
      };

      const service = require('../../../src/services/movieApi').default;
      const result = service.convertToDbFormat(externalMovie);

      expect(result.rating).toBe(0);
    });

    it('should handle cast as array of objects', () => {
      const externalMovie: ExternalMovie = {
        id: 12345,
        title: 'Test Movie',
        director: 'Test Director',
        cast: [
          { name: 'Actor 1' },
          { name: 'Actor 2' },
        ] as any,
        releaseDate: '2024-01-01',
      };

      const service = require('../../../src/services/movieApi').default;
      const result = service.convertToDbFormat(externalMovie);

      expect(Array.isArray(result.cast)).toBe(true);
      expect(result.cast.length).toBeGreaterThan(0);
      expect(typeof result.cast[0]).toBe('string');
    });
  });
});
