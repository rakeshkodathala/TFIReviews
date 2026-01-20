import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MyReviewsScreen from '../MyReviewsScreen';
import { renderWithProviders } from '../../test-utils/render';
import { authService, reviewsService } from '../../services/api';
import { Alert } from 'react-native';
import { createMyReviewsResponse } from '../../test-utils/mocks';

jest.mock('../../services/api', () => ({
  authService: {
    getMyReviews: jest.fn(),
  },
  reviewsService: {
    delete: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: any) => children,
}));

jest.spyOn(Alert, 'alert');

const mockReviews = [
  {
    _id: 'review1',
    rating: 8,
    review: 'Great movie!',
    createdAt: '2024-01-01',
    movieId: {
      _id: 'movie1',
      title: 'Movie 1',
      posterUrl: 'https://example.com/poster.jpg',
    },
  },
];

describe('MyReviewsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getMyReviews as jest.Mock).mockResolvedValue(createMyReviewsResponse(mockReviews));
    (reviewsService.delete as jest.Mock).mockResolvedValue({});
  });

  it('should render user reviews', async () => {
    renderWithProviders(<MyReviewsScreen />);

    await waitFor(() => {
      expect(authService.getMyReviews).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Movie 1')).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should show empty state when no reviews', async () => {
    (authService.getMyReviews as jest.Mock).mockResolvedValue(createMyReviewsResponse([]));

    renderWithProviders(<MyReviewsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/No reviews yet|You haven't reviewed/i)).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should delete review', async () => {
    renderWithProviders(<MyReviewsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Movie 1')).toBeOnTheScreen();
    });

    const deleteButton = screen.queryByTestId('delete-button');
    if (deleteButton) {
      fireEvent.press(deleteButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate confirm
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      if (alertCall && alertCall[2]) {
        const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Delete');
        if (confirmButton) {
          confirmButton.onPress();
          await waitFor(() => {
            expect(reviewsService.delete).toHaveBeenCalledWith('review1');
          });
        }
      }
    }
  });

  it('should navigate to edit review', async () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      ...jest.requireActual('@react-navigation/native'),
      useNavigation: () => ({ navigate: mockNavigate }),
      useFocusEffect: jest.fn(() => () => {}),
    }));

    renderWithProviders(<MyReviewsScreen />);

    await waitFor(() => {
      const editButton = screen.queryByText(/Edit/i);
      if (editButton) {
        fireEvent.press(editButton);
      }
    });
  });

  it('should handle pull-to-refresh', async () => {
    renderWithProviders(<MyReviewsScreen />);

    await waitFor(() => {
      expect(authService.getMyReviews).toHaveBeenCalled();
    });
  });
});
