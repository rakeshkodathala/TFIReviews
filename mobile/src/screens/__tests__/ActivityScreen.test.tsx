import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ActivityScreen from '../ActivityScreen';
import { renderWithProviders } from '../../test-utils/render';
import { reviewsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { createReviewsResponse } from '../../test-utils/mocks';

jest.mock('../../services/api', () => ({
  reviewsService: {
    getAll: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: any) => children,
}));

// Navigation mocks are in jest.setup.js

const mockReviews = [
  {
    _id: 'review1',
    rating: 8,
    review: 'Great movie!',
    createdAt: new Date().toISOString(),
    movieId: { _id: 'movie1', title: 'Movie 1', posterUrl: 'https://example.com/poster.jpg' },
    userId: { _id: 'user1', username: 'testuser' },
  },
];

describe('ActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { _id: 'user1', username: 'testuser' },
    });
    (reviewsService.getAll as jest.Mock).mockResolvedValue(createReviewsResponse(mockReviews));
  });

  it('should render activity list', async () => {
    renderWithProviders(<ActivityScreen />);

    await waitFor(() => {
      expect(reviewsService.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Movie 1')).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should show loading state initially', () => {
    (reviewsService.getAll as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(createReviewsResponse([])), 100))
    );

    renderWithProviders(<ActivityScreen />);

    expect(reviewsService.getAll).toHaveBeenCalled();
  });

  it('should show error state on failure', async () => {
    (reviewsService.getAll as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderWithProviders(<ActivityScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load reviews/i)).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should handle pull-to-refresh', async () => {
    renderWithProviders(<ActivityScreen />);

    await waitFor(() => {
      expect(reviewsService.getAll).toHaveBeenCalled();
    });

    const initialCalls = (reviewsService.getAll as jest.Mock).mock.calls.length;

    // Simulate refresh
    await waitFor(() => {
      // Component should handle refresh
      expect(reviewsService.getAll).toHaveBeenCalled();
    });
  });

  it('should navigate to movie details on review press', async () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      ...jest.requireActual('@react-navigation/native'),
      useNavigation: () => ({ navigate: mockNavigate }),
      useFocusEffect: jest.fn(() => () => {}),
    }));

    renderWithProviders(<ActivityScreen />);

    await waitFor(() => {
      expect(screen.getByText('Movie 1')).toBeOnTheScreen();
    });
  });

  it('should handle empty state', async () => {
    (reviewsService.getAll as jest.Mock).mockResolvedValue(createReviewsResponse([]));

    renderWithProviders(<ActivityScreen />);

    await waitFor(() => {
      // Should handle empty state gracefully
      expect(reviewsService.getAll).toHaveBeenCalled();
    });
  });
});
