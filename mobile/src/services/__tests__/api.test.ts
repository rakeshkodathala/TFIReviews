import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock axios before importing the service
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
    create: jest.fn(() => mockAxiosInstance),
  };
});

// Import after mocking
import axios from 'axios';
import {
  authService,
  watchlistService,
  moviesService,
  reviewsService,
  movieSearchService,
} from '../api';

const mockAxiosInstance = (axios.create as jest.Mock)();

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('authService', () => {
    describe('register', () => {
      it('should register user and store token', async () => {
        const mockResponse = {
          data: {
            token: 'test-token',
            user: { id: '1', username: 'testuser', email: 'test@example.com' },
          },
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await authService.register({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@tfireviews:token',
          'test-token'
        );
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle registration errors', async () => {
        const error = new Error('Registration failed');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(
          authService.register({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
          })
        ).rejects.toThrow('Registration failed');
      });
    });

    describe('login', () => {
      it('should login user and store token', async () => {
        const mockResponse = {
          data: {
            token: 'test-token',
            user: { id: '1', username: 'testuser', email: 'test@example.com' },
          },
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await authService.login({
          email: 'test@example.com',
          password: 'password123',
        });

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@tfireviews:token',
          'test-token'
        );
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle login errors', async () => {
        const error = new Error('Invalid credentials');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(
          authService.login({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
        ).rejects.toThrow('Invalid credentials');
      });
    });

    describe('logout', () => {
      it('should remove token and user from storage', async () => {
        await authService.logout();

        expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
          '@tfireviews:token',
          '@tfireviews:user',
        ]);
      });
    });

    describe('getStoredToken', () => {
      it('should retrieve stored token', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('stored-token');

        const token = await authService.getStoredToken();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@tfireviews:token');
        expect(token).toBe('stored-token');
      });

      it('should return null if no token stored', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

        const token = await authService.getStoredToken();

        expect(token).toBeNull();
      });
    });

    describe('getStoredUser', () => {
      it('should retrieve stored user', async () => {
        const user = { id: '1', username: 'testuser' };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(user));

        const result = await authService.getStoredUser();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@tfireviews:user');
        expect(result).toEqual(user);
      });

      it('should return null if no user stored', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

        const result = await authService.getStoredUser();

        expect(result).toBeNull();
      });
    });

    describe('verifyToken', () => {
      it('should verify token with API', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { valid: true } });

        await authService.verifyToken();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/verify');
      });
    });

    describe('updateProfile', () => {
      it('should update profile and store user', async () => {
        const mockResponse = {
          data: {
            user: { id: '1', username: 'testuser', name: 'Updated Name' },
          },
        };

        mockAxiosInstance.put.mockResolvedValue(mockResponse);

        const result = await authService.updateProfile({ name: 'Updated Name' });

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/profile', {
          name: 'Updated Name',
        });
        expect(AsyncStorage.setItem).toHaveBeenCalled();
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('getStats', () => {
      it('should fetch user stats', async () => {
        const mockResponse = { data: { totalReviews: 10, totalWatchlist: 5 } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await authService.getStats();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/stats');
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('getMyReviews', () => {
      it('should fetch user reviews', async () => {
        const mockResponse = { data: { reviews: [] } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await authService.getMyReviews(10);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/reviews', {
          params: { limit: 10 },
        });
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('watchlistService', () => {
    describe('getAll', () => {
      it('should fetch watchlist with pagination', async () => {
        const mockResponse = { data: { watchlist: [] } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await watchlistService.getAll({ page: 1, limit: 20 });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/watchlist', {
          params: { page: 1, limit: 20 },
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('getCount', () => {
      it('should fetch watchlist count', async () => {
        const mockResponse = { data: { count: 5 } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await watchlistService.getCount();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/watchlist/count');
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('add', () => {
      it('should add movie to watchlist with movieId', async () => {
        const mockResponse = { data: { message: 'Added' } };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await watchlistService.add('movie-id-123');

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/watchlist', {
          movieId: 'movie-id-123',
          tmdbId: undefined,
        });
        expect(result).toEqual(mockResponse.data);
      });

      it('should add movie to watchlist with tmdbId', async () => {
        const mockResponse = { data: { message: 'Added' } };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await watchlistService.add(undefined, 12345);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/watchlist', {
          movieId: undefined,
          tmdbId: 12345,
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('remove', () => {
      it('should remove movie from watchlist', async () => {
        const mockResponse = { data: { message: 'Removed' } };
        mockAxiosInstance.delete.mockResolvedValue(mockResponse);

        const result = await watchlistService.remove('watchlist-id-123');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/watchlist/watchlist-id-123');
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('check', () => {
      it('should check if movie is in watchlist', async () => {
        const mockResponse = { data: { inWatchlist: true } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await watchlistService.check('movie-id-123');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/watchlist/check', {
          params: { movieId: 'movie-id-123', tmdbId: undefined },
        });
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('moviesService', () => {
    describe('getAll', () => {
      it('should fetch movies with params', async () => {
        const mockResponse = { data: { movies: [] } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await moviesService.getAll({
          page: 1,
          limit: 20,
          search: 'test',
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/movies', {
          params: { page: 1, limit: 20, search: 'test' },
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('getById', () => {
      it('should fetch movie by id', async () => {
        const mockResponse = { data: { id: '123', title: 'Test Movie' } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await moviesService.getById('123');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/movies/123');
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('reviewsService', () => {
    describe('getAll', () => {
      it('should fetch all reviews', async () => {
        const mockResponse = { data: { reviews: [] } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await reviewsService.getAll({ page: 1, limit: 20 });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/reviews', {
          params: { page: 1, limit: 20 },
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('create', () => {
      it('should create review', async () => {
        const mockResponse = { data: { id: '123', rating: 8 } };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await reviewsService.create({
          movieId: 'movie-123',
          rating: 8,
          review: 'Great movie!',
        });

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/reviews', {
          movieId: 'movie-123',
          rating: 8,
          review: 'Great movie!',
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('update', () => {
      it('should update review', async () => {
        const mockResponse = { data: { id: '123', rating: 9 } };
        mockAxiosInstance.put.mockResolvedValue(mockResponse);

        const result = await reviewsService.update('123', { rating: 9 });

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/reviews/123', {
          rating: 9,
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('delete', () => {
      it('should delete review', async () => {
        const mockResponse = { data: { message: 'Deleted' } };
        mockAxiosInstance.delete.mockResolvedValue(mockResponse);

        const result = await reviewsService.delete('123');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/reviews/123');
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('movieSearchService', () => {
    describe('search', () => {
      it('should search movies', async () => {
        const mockResponse = { data: { movies: [] } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await movieSearchService.search({
          query: 'bahubali',
          language: 'te',
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/movie-search/search', {
          params: { query: 'bahubali', language: 'te' },
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('getMovieDetails', () => {
      it('should fetch movie details by tmdbId', async () => {
        const mockResponse = { data: { id: 12345, title: 'Test Movie' } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await movieSearchService.getMovieDetails(12345);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/movie-search/movie/12345');
        expect(result).toEqual(mockResponse.data);
      });
    });
  });
});
