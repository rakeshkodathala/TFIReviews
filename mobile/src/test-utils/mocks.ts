/**
 * Standardized mocks for testing
 * Use these to ensure consistency across all test files
 */

import React from 'react';

// ============================================
// NAVIGATION MOCK
// ============================================
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()), // Returns unsubscribe function
  reset: jest.fn(),
  canGoBack: jest.fn(() => true),
  dispatch: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  isFocused: jest.fn(() => true),
  jumpTo: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
});

// ============================================
// useFocusEffect MOCK
// ============================================
export const createUseFocusEffectMock = () => {
  return jest.fn((callback: () => void | (() => void)) => {
    // Execute callback immediately for testing
    if (typeof callback === 'function') {
      const cleanup = callback();
      // Return cleanup function if provided
      return typeof cleanup === 'function' ? cleanup : () => {};
    }
    return () => {};
  });
};

// ============================================
// useNavigation MOCK
// ============================================
export const createUseNavigationMock = (customNav?: any) => {
  return () => customNav || createMockNavigation();
};

// ============================================
// useAuth MOCK
// ============================================
export const createMockUseAuth = (overrides = {}) => ({
  isAuthenticated: true,
  isLoading: false,
  user: {
    _id: 'user1',
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
  },
  token: 'mock-token',
  login: jest.fn().mockResolvedValue({ user: {}, token: 'token' }),
  register: jest.fn().mockResolvedValue({ user: {}, token: 'token' }),
  logout: jest.fn().mockResolvedValue(undefined),
  updateUser: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ============================================
// SERVICE MOCK RETURN SHAPES (Based on actual backend responses)
// ============================================

// moviesService.getAll() returns: { movies: [], pagination: { page, limit, total, pages } }
export const createMoviesResponse = (movies: any[] = [], page = 1, limit = 20) => ({
  movies,
  pagination: {
    page,
    limit,
    total: movies.length,
    pages: Math.ceil(movies.length / limit),
  },
});

// reviewsService.getAll() returns: { reviews: [], pagination: { page, limit, total, pages } }
export const createReviewsResponse = (reviews: any[] = [], page = 1, limit = 50) => ({
  reviews,
  pagination: {
    page,
    limit,
    total: reviews.length,
    pages: Math.ceil(reviews.length / limit),
  },
});

// reviewsService.getByMovie() / getByTmdbId() returns: { reviews: [], pagination: {...} }
export const createMovieReviewsResponse = (reviews: any[] = [], page = 1, limit = 20) => ({
  reviews,
  pagination: {
    page,
    limit,
    total: reviews.length,
    pages: Math.ceil(reviews.length / limit),
  },
});

// watchlistService.getAll() returns: { watchlist: [], pagination: { page, limit, total, pages } }
export const createWatchlistResponse = (watchlist: any[] = [], page = 1, limit = 20) => ({
  watchlist,
  pagination: {
    page,
    limit,
    total: watchlist.length,
    pages: Math.ceil(watchlist.length / limit),
  },
});

// watchlistService.getCount() returns: { count: number }
export const createWatchlistCountResponse = (count: number) => ({
  count,
});

// watchlistService.check() returns: { inWatchlist: boolean, watchlistItem: any | null }
export const createWatchlistCheckResponse = (isInWatchlist: boolean, watchlistItem: any = null) => ({
  inWatchlist: isInWatchlist,
  watchlistItem,
});

// authService.getMyReviews() returns: { reviews: [] }
export const createMyReviewsResponse = (reviews: any[] = []) => ({
  reviews,
});

// authService.getStats() returns: { totalReviews, avgRating, reviewsThisMonth, mostCommonRating, memberSince }
export const createStatsResponse = (overrides = {}) => ({
  totalReviews: 0,
  avgRating: 0,
  reviewsThisMonth: 0,
  mostCommonRating: 0,
  memberSince: new Date().toISOString(),
  ...overrides,
});

// movieSearchService.search() / getPopular() / getTollywood() returns: { movies: [] }
export const createMovieSearchResponse = (movies: any[] = []) => ({
  movies,
});

// movieSearchService.getMovieDetails() returns: movie object
export const createMovieDetailsResponse = (movie: any) => ({
  ...movie,
});

// ============================================
// ROUTE MOCK
// ============================================
export const createMockRoute = <T extends Record<string, any>>(params: T, name = 'TestScreen') => ({
  params,
  key: 'test-key',
  name: name as any,
});
