import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the API service
jest.mock('../../services/api', () => ({
  authService: {
    getStoredToken: jest.fn(),
    getStoredUser: jest.fn(),
    verifyToken: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);
      (authService.getStoredUser as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load stored auth on mount', async () => {
      const storedToken = 'stored-token';
      const storedUser = { id: '1', username: 'testuser', email: 'test@example.com' };

      (authService.getStoredToken as jest.Mock).mockResolvedValue(storedToken);
      (authService.getStoredUser as jest.Mock).mockResolvedValue(storedUser);
      (authService.verifyToken as jest.Mock).mockResolvedValue({ data: { valid: true } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(authService.getStoredToken).toHaveBeenCalled();
      expect(authService.getStoredUser).toHaveBeenCalled();
      expect(authService.verifyToken).toHaveBeenCalled();
    });

    it('should clear invalid stored auth', async () => {
      const storedToken = 'invalid-token';
      const storedUser = { id: '1', username: 'testuser' };

      (authService.getStoredToken as jest.Mock).mockResolvedValue(storedToken);
      (authService.getStoredUser as jest.Mock).mockResolvedValue(storedUser);
      (authService.verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Login', () => {
    it('should login user successfully', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);
      (authService.getStoredUser as jest.Mock).mockResolvedValue(null);

      const mockResponse = {
        token: 'new-token',
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.token).toBe(mockResponse.token);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login errors', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);
      (authService.getStoredUser as jest.Mock).mockResolvedValue(null);
      (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Register', () => {
    it('should register user successfully', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);
      (authService.getStoredUser as jest.Mock).mockResolvedValue(null);

      const mockResponse = {
        token: 'new-token',
        user: { id: '1', username: 'newuser', email: 'new@example.com' },
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register('newuser', 'new@example.com', 'password123', 'New User');
      });

      expect(authService.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.token).toBe(mockResponse.token);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle registration errors', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);
      (authService.getStoredUser as jest.Mock).mockResolvedValue(null);
      (authService.register as jest.Mock).mockRejectedValue(new Error('User already exists'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.register('existinguser', 'existing@example.com', 'password123');
        })
      ).rejects.toThrow('User already exists');
    });
  });

  describe('Logout', () => {
    it('should logout user and clear state', async () => {
      const storedToken = 'stored-token';
      const storedUser = { id: '1', username: 'testuser' };

      (authService.getStoredToken as jest.Mock).mockResolvedValue(storedToken);
      (authService.getStoredUser as jest.Mock).mockResolvedValue(storedUser);
      (authService.verifyToken as jest.Mock).mockResolvedValue({ data: { valid: true } });
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Update User', () => {
    it('should update user profile', async () => {
      const storedToken = 'stored-token';
      const storedUser = { id: '1', username: 'testuser', name: 'Old Name' };

      (authService.getStoredToken as jest.Mock).mockResolvedValue(storedToken);
      (authService.getStoredUser as jest.Mock).mockResolvedValue(storedUser);
      (authService.verifyToken as jest.Mock).mockResolvedValue({ data: { valid: true } });

      const updatedUser = { ...storedUser, name: 'New Name' };
      (authService.updateProfile as jest.Mock).mockResolvedValue({ user: updatedUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.updateUser({ name: 'New Name' });
      });

      expect(authService.updateProfile).toHaveBeenCalledWith({ name: 'New Name' });
      expect(result.current.user?.name).toBe('New Name');
    });
  });

  describe('useAuth Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
