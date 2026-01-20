import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MoviesScreen from '../MoviesScreen';
import { renderWithProviders } from '../../test-utils/render';
import {
  moviesService,
  movieSearchService,
  authService,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { createMoviesResponse, createMovieSearchResponse, createMyReviewsResponse, createStatsResponse } from '../../test-utils/mocks';

// Mock services BEFORE importing component
jest.mock('../../services/api', () => ({
  moviesService: {
    getAll: jest.fn(),
  },
  movieSearchService: {
    getTollywood: jest.fn(),
  },
  reviewsService: {
    getByMovie: jest.fn(),
  },
  authService: {
    getMyReviews: jest.fn(),
    getStats: jest.fn(),
  },
}));

// Mock useAuth
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: any) => children,
}));

// Mock TrendingTab
jest.mock('../TrendingTab', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockTrendingTab() {
      return React.createElement('View', { testID: 'trending-tab' });
    },
  };
});

// Mock SafeAreaInsets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
  SafeAreaProvider: ({ children }: any) => children,
}));

// Navigation mocks are in jest.setup.js

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockMovies = [
  {
    _id: '1',
    title: 'Movie 1',
    posterUrl: 'https://example.com/poster1.jpg',
    rating: 8.5,
    releaseDate: '2023-01-01',
    tmdbId: 123,
    genre: ['Action', 'Drama'],
    totalReviews: 10,
  },
  {
    _id: '2',
    title: 'Movie 2',
    posterUrl: 'https://example.com/poster2.jpg',
    rating: 7.2,
    releaseDate: '2023-02-01',
    tmdbId: 456,
    genre: ['Comedy'],
    totalReviews: 5,
  },
];

describe('MoviesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { _id: 'user1', username: 'testuser' },
    });
    (moviesService.getAll as jest.Mock).mockResolvedValue(createMoviesResponse(mockMovies));
    (authService.getMyReviews as jest.Mock).mockResolvedValue(createMyReviewsResponse([]));
    (authService.getStats as jest.Mock).mockResolvedValue(createStatsResponse());
    (movieSearchService.getTollywood as jest.Mock).mockResolvedValue(createMovieSearchResponse(mockMovies));
  });

  describe('Initial Render', () => {
    it('should render with default "For You" tab', async () => {
      renderWithProviders(<MoviesScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(screen.getByText('For You')).toBeOnTheScreen();
      }, { timeout: 3000 });
      
      expect(screen.getByText('Trending')).toBeOnTheScreen();
      expect(screen.getByText('My Reviews')).toBeOnTheScreen();
    });

    it('should show sign in message when not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(<MoviesScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(screen.getByText(/Sign In to See Your Feed/i)).toBeOnTheScreen();
      }, { timeout: 3000 });
    });
  });

  describe('Tab Switching', () => {
    it('should switch to My Reviews tab', async () => {
      renderWithProviders(<MoviesScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(screen.getByText('My Reviews')).toBeOnTheScreen();
      });

      const myReviewsTab = screen.getByText('My Reviews');
      fireEvent.press(myReviewsTab);

      await waitFor(() => {
        expect(moviesService.getAll).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should switch to Trending tab', async () => {
      renderWithProviders(<MoviesScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(screen.getByText('Trending')).toBeOnTheScreen();
      });

      const trendingTab = screen.getByText('Trending');
      fireEvent.press(trendingTab);

      // Trending tab should be active
      await waitFor(() => {
        expect(trendingTab).toBeOnTheScreen();
      });
    });
  });

  describe('My Reviews Tab', () => {
  it('should display movies when loaded', async () => {
    renderWithProviders(<MoviesScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('My Reviews')).toBeOnTheScreen();
    });

    const myReviewsTab = screen.getByText('My Reviews');
    fireEvent.press(myReviewsTab);

    await waitFor(() => {
      expect(moviesService.getAll).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Wait for movies to render
    await waitFor(() => {
      expect(screen.getByText('Movie 1')).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should show empty state when no movies', async () => {
    (moviesService.getAll as jest.Mock).mockResolvedValue(createMoviesResponse([]));

    renderWithProviders(<MoviesScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('My Reviews')).toBeOnTheScreen();
    });

    const myReviewsTab = screen.getByText('My Reviews');
    fireEvent.press(myReviewsTab);

    await waitFor(() => {
      expect(screen.getByText(/No Movies Found/i)).toBeOnTheScreen();
    }, { timeout: 3000 });
  });
  });

  describe('Error Handling', () => {
  it('should handle API errors gracefully', async () => {
    (moviesService.getAll as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Failed to load movies' } },
    });

    renderWithProviders(<MoviesScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('My Reviews')).toBeOnTheScreen();
    });

    const myReviewsTab = screen.getByText('My Reviews');
    fireEvent.press(myReviewsTab);

    await waitFor(() => {
      // Should fallback to popular movies
      expect(movieSearchService.getTollywood).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
  });
});
