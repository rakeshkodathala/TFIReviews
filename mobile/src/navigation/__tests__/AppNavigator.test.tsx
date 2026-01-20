import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AppNavigator from '../AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('../../SplashScreen', () => {
  const React = require('react');
  return function MockSplashScreen() {
    return React.createElement('View', { testID: 'splash-screen' });
  };
});

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show splash screen while loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
    });

    const { getByTestId } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );

    expect(getByTestId('splash-screen')).toBeTruthy();
  });

  it('should render authenticated navigation when logged in', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { _id: 'user1', username: 'testuser' },
    });

    const { getByText } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );

    await waitFor(() => {
      // Should show main tabs - look for any tab text
      const homeTab = getByText(/Home|Movies|Search|Activity|Account/i);
      expect(homeTab).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should render auth stack when not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
    });

    const { getByText } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );

    await waitFor(() => {
      // Should show login screen - look for login form elements
      const loginElement = getByText(/Login|Email|Password|Don't have an account/i);
      expect(loginElement).toBeTruthy();
    }, { timeout: 3000 });
  });
});
