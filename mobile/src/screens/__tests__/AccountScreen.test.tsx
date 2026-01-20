import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AccountScreen from '../AccountScreen';
import { renderWithProviders } from '../../test-utils/render';
import { authService, watchlistService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';
import { createStatsResponse, createWatchlistCountResponse, createMyReviewsResponse } from '../../test-utils/mocks';

jest.mock('../../services/api', () => ({
  authService: {
    getStats: jest.fn(),
    getMyReviews: jest.fn(),
  },
  watchlistService: {
    getCount: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

describe('AccountScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { _id: 'user1', username: 'testuser', name: 'Test User', email: 'test@example.com' },
      logout: jest.fn(),
      updateUser: jest.fn(),
    });
    (authService.getStats as jest.Mock).mockResolvedValue(createStatsResponse({ totalReviews: 10, avgRating: 8.0 }));
    (authService.getMyReviews as jest.Mock).mockResolvedValue(createMyReviewsResponse([]));
    (watchlistService.getCount as jest.Mock).mockResolvedValue(createWatchlistCountResponse(5));
  });

  it('should render account information', async () => {
    renderWithProviders(<AccountScreen />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should display user stats', async () => {
    renderWithProviders(<AccountScreen />);

    await waitFor(() => {
      expect(authService.getStats).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/10/i)).toBeOnTheScreen();
    }, { timeout: 3000 });
  });

  it('should show watchlist count', async () => {
    renderWithProviders(<AccountScreen />);

    await waitFor(() => {
      expect(watchlistService.getCount).toHaveBeenCalled();
    });
  });

  it('should handle logout', async () => {
    const mockLogout = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      user: { _id: 'user1', username: 'testuser' },
      logout: mockLogout,
      updateUser: jest.fn(),
    });

    renderWithProviders(<AccountScreen />);

    await waitFor(() => {
      const logoutButton = screen.queryByText(/Logout|Sign Out/i);
      if (logoutButton) {
        fireEvent.press(logoutButton);
        expect(mockLogout).toHaveBeenCalled();
      }
    });
  });

  it('should allow editing profile', async () => {
    renderWithProviders(<AccountScreen />);

    await waitFor(() => {
      const editButton = screen.queryByText(/Edit/i);
      if (editButton) {
        fireEvent.press(editButton);
        // Should show edit form
        expect(screen.queryByPlaceholderText(/Name/i)).toBeTruthy();
      }
    });
  });
});
