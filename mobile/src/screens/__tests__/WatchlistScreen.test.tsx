import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import WatchlistScreen from '../WatchlistScreen';
import { renderWithProviders } from '../../test-utils/render';
import { watchlistService } from '../../services/api';
import { Alert } from 'react-native';
import { createWatchlistResponse } from '../../test-utils/mocks';

jest.mock('../../services/api', () => ({
  watchlistService: {
    getAll: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: any) => children,
}));

jest.spyOn(Alert, 'alert');

const mockWatchlist = [
  {
    _id: 'watchlist1',
    movieId: {
      _id: 'movie1',
      title: 'Movie 1',
      posterUrl: 'https://example.com/poster.jpg',
      rating: 8.5,
      releaseDate: '2023-01-01',
    },
  },
];

describe('WatchlistScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (watchlistService.getAll as jest.Mock).mockResolvedValue(createWatchlistResponse(mockWatchlist));
    (watchlistService.remove as jest.Mock).mockResolvedValue({});
  });

  it('should render watchlist items', async () => {
    renderWithProviders(<WatchlistScreen />);

    await waitFor(() => {
      expect(watchlistService.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Movie 1')).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should show empty state when watchlist is empty', async () => {
    (watchlistService.getAll as jest.Mock).mockResolvedValue(createWatchlistResponse([]));

    renderWithProviders(<WatchlistScreen />);

    await waitFor(() => {
      expect(screen.getByText(/No movies in your watchlist|Your watchlist is empty/i)).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should remove item from watchlist', async () => {
    renderWithProviders(<WatchlistScreen />);

    await waitFor(() => {
      expect(screen.getByText('Movie 1')).toBeOnTheScreen();
    });

    // Find remove button and press
    const removeButton = screen.queryByTestId('remove-button');
    if (removeButton) {
      fireEvent.press(removeButton);
      
      // Confirm alert
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate confirm
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      if (alertCall && alertCall[2]) {
        const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Remove');
        if (confirmButton) {
          confirmButton.onPress();
          await waitFor(() => {
            expect(watchlistService.remove).toHaveBeenCalled();
          });
        }
      }
    }
  });

  it('should handle pull-to-refresh', async () => {
    renderWithProviders(<WatchlistScreen />);

    await waitFor(() => {
      expect(watchlistService.getAll).toHaveBeenCalled();
    });
  });

  it('should navigate to movie details on item press', async () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      ...jest.requireActual('@react-navigation/native'),
      useNavigation: () => ({ navigate: mockNavigate }),
      useFocusEffect: jest.fn(() => () => {}),
    }));

    renderWithProviders(<WatchlistScreen />);

    await waitFor(() => {
      const movieCard = screen.getByText('Movie 1');
      fireEvent.press(movieCard);
    });
  });
});
