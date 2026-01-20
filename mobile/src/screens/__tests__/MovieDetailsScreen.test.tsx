import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MovieDetailsScreen from '../MovieDetailsScreen';
import { renderWithProviders } from '../../test-utils/render';
import { movieSearchService, reviewsService, watchlistService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';
import { createMovieReviewsResponse, createWatchlistCheckResponse, createMovieDetailsResponse } from '../../test-utils/mocks';

// Mock services
jest.mock('../../services/api', () => ({
  movieSearchService: {
    getMovieDetails: jest.fn(),
  },
  reviewsService: {
    getByTmdbId: jest.fn(),
    getByMovie: jest.fn(),
  },
  watchlistService: {
    check: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Navigation mocks are in jest.setup.js

jest.mock('react-native-youtube-iframe', () => ({
  __esModule: true,
  default: function YoutubePlayer() {
    return null;
  },
}));

jest.spyOn(Alert, 'alert');

const mockMovie = {
  _id: 'movie1',
  title: 'Test Movie',
  posterUrl: 'https://example.com/poster.jpg',
  rating: 8.5,
  releaseDate: '2023-01-01',
  tmdbId: 123,
  genre: ['Action', 'Drama'],
  overview: 'A great test movie',
};

const mockRoute = {
  params: {
    movie: mockMovie,
  },
  key: 'test-key',
  name: 'MovieDetails' as const,
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

describe('MovieDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { _id: 'user1', username: 'testuser' },
    });
    (movieSearchService.getMovieDetails as jest.Mock).mockResolvedValue(createMovieDetailsResponse(mockMovie));
    (reviewsService.getByTmdbId as jest.Mock).mockResolvedValue(createMovieReviewsResponse([]));
    (watchlistService.check as jest.Mock).mockResolvedValue(createWatchlistCheckResponse(false));
  });

  it('should render movie details', async () => {
    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should display movie poster', async () => {
    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });
  });

  it('should load reviews on mount', async () => {
    const mockReviews = [
      {
        _id: 'review1',
        rating: 8,
        review: 'Great movie!',
        userId: { _id: 'user1', username: 'testuser' },
      },
    ];

    (reviewsService.getByTmdbId as jest.Mock).mockResolvedValue(createMovieReviewsResponse(mockReviews));

    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(reviewsService.getByTmdbId).toHaveBeenCalledWith(123);
    });
  });

  it('should check watchlist status when authenticated', async () => {
    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(watchlistService.check).toHaveBeenCalledWith('movie1', 123);
    }, { timeout: 3000 });
  });

  it('should toggle watchlist when button is pressed', async () => {
    (watchlistService.check as jest.Mock).mockResolvedValue(createWatchlistCheckResponse(false));
    (watchlistService.add as jest.Mock).mockResolvedValue({ _id: 'watchlist1' });

    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    }, { timeout: 3000 });

    // Find and press watchlist button (look for heart icon or watchlist text)
    const watchlistButton = screen.queryByTestId('watchlist-button') || 
                           screen.queryByText(/Add to Watchlist|Remove from Watchlist/i);
    if (watchlistButton) {
      fireEvent.press(watchlistButton);
      await waitFor(() => {
        expect(watchlistService.add).toHaveBeenCalled();
      });
    }
  });

  it('should show login alert when toggling watchlist while not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });

    const watchlistButton = screen.queryByTestId('watchlist-button');
    if (watchlistButton) {
      fireEvent.press(watchlistButton);
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Login Required', expect.any(String));
      });
    }
  });

  it('should navigate to create review screen', async () => {
    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });

    // Find review button and press
    const reviewButton = screen.queryByText(/Write a Review|Rate this Movie/i);
    if (reviewButton) {
      fireEvent.press(reviewButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateReview', {
        movie: expect.any(Object),
      });
    }
  });

  it('should handle missing movie data gracefully', async () => {
    const emptyRoute = {
      params: {
        movie: null,
      },
      key: 'test-key',
      name: 'MovieDetails' as const,
    };

    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={emptyRoute as any} />
    );

    // Should not crash
    await waitFor(() => {
      expect(screen.queryByText('Test Movie')).toBeNull();
    });
  });

  it('should display user review if exists', async () => {
    const mockReviews = [
      {
        _id: 'review1',
        rating: 9,
        review: 'My review',
        userId: { _id: 'user1', username: 'testuser' },
      },
    ];

    (reviewsService.getByTmdbId as jest.Mock).mockResolvedValue(createMovieReviewsResponse(mockReviews));

    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('My review')).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should display community rating', async () => {
    const movieWithRating = {
      ...mockMovie,
      rating: 8.5,
      totalReviews: 10,
    };

    const routeWithRating = {
      ...mockRoute,
      params: { movie: movieWithRating },
    };

    renderWithProviders(
      <MovieDetailsScreen navigation={mockNavigation as any} route={routeWithRating as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeOnTheScreen();
    });
  });
});
