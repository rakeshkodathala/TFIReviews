import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const TOKEN_KEY = '@tfireviews:token';
const USER_KEY = '@tfireviews:user';

// Request interceptor - Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  async register(data: { username: string; email: string; password: string; name?: string }) {
    const response = await apiClient.post('/auth/register', data);
    if (response.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(data: { email: string; password: string }) {
    const response = await apiClient.post('/auth/login', data);
    if (response.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },

  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async getStoredUser(): Promise<any | null> {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async verifyToken() {
    return await apiClient.get('/auth/verify');
  },

  async updateProfile(data: { name?: string; avatar?: string; location?: string }) {
    const response = await apiClient.put('/auth/profile', data);
    if (response.data.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    const response = await apiClient.put('/auth/password', data);
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/auth/stats');
    return response.data;
  },

  async getMyReviews(limit?: number) {
    const response = await apiClient.get('/auth/reviews', { params: { limit } });
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyOTP(email: string, otp: string) {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  async resetPassword(email: string, otp: string, newPassword: string, confirmPassword: string) {
    const response = await apiClient.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  async deleteAccount(password: string) {
    const response = await apiClient.delete('/auth/account', {
      data: { password },
    });
    return response.data;
  },

  async exportData() {
    const response = await apiClient.get('/auth/export', {
      responseType: 'blob', // Important for file download
    });
    return response.data;
  },
};

// Comments Service
export const commentsService = {
  async getByReview(reviewId: string, params?: { page?: number; limit?: number }) {
    const response = await apiClient.get(`/reviews/${reviewId}/comments`, { params });
    return response.data;
  },

  async create(reviewId: string, comment: string) {
    const response = await apiClient.post(`/reviews/${reviewId}/comments`, { comment });
    return response.data;
  },

  async update(commentId: string, comment: string) {
    const response = await apiClient.put(`/reviews/comments/${commentId}`, { comment });
    return response.data;
  },

  async delete(commentId: string) {
    const response = await apiClient.delete(`/reviews/comments/${commentId}`);
    return response.data;
  },
};

// Watchlist Service
export const watchlistService = {
  async getAll(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get('/watchlist', { params });
    return response.data;
  },

  async getCount() {
    const response = await apiClient.get('/watchlist/count');
    return response.data;
  },

  async add(movieId?: string, tmdbId?: number) {
    const response = await apiClient.post('/watchlist', { movieId, tmdbId });
    return response.data;
  },

  async remove(id: string) {
    const response = await apiClient.delete(`/watchlist/${id}`);
    return response.data;
  },

  async check(movieId?: string, tmdbId?: number) {
    const response = await apiClient.get('/watchlist/check', {
      params: { movieId, tmdbId },
    });
    return response.data;
  },
};

// Movies Service
export const moviesService = {
  async getAll(params?: { page?: number; limit?: number; search?: string; genre?: string; sortBy?: string }) {
    const response = await apiClient.get('/movies', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/movies/${id}`);
    return response.data;
  },
};

// Reviews Service
export const reviewsService = {
  async getAll(params?: { page?: number; limit?: number; userId?: string }) {
    const response = await apiClient.get('/reviews', { params });
    return response.data;
  },

  async getById(id: string, userId?: string) {
    const params = userId ? { userId } : {};
    const response = await apiClient.get(`/reviews/${id}`, { params });
    return response.data;
  },

  async getByMovie(movieId: string, userId?: string) {
    const params = userId ? { userId } : {};
    const response = await apiClient.get(`/reviews/movie/${movieId}`, { params });
    return response.data;
  },

  async getByTmdbId(tmdbId: number, userId?: string) {
    const params = userId ? { userId } : {};
    const response = await apiClient.get(`/reviews/tmdb/${tmdbId}`, { params });
    return response.data;
  },

  async create(data: { movieId?: string; tmdbId?: number; rating: number; title?: string; review: string }) {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  },

  async update(id: string, data: { rating?: number; title?: string; review?: string }) {
    const response = await apiClient.put(`/reviews/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/reviews/${id}`);
    return response.data;
  },

  async like(reviewId: string) {
    const response = await apiClient.post(`/reviews/${reviewId}/like`);
    return response.data;
  },

  async unlike(reviewId: string) {
    const response = await apiClient.delete(`/reviews/${reviewId}/like`);
    return response.data;
  },

  async getLikes(reviewId: string) {
    const response = await apiClient.get(`/reviews/${reviewId}/likes`);
    return response.data;
  },
};

// Movie Search Service (TMDB)
export const movieSearchService = {
  async search(params: { query: string; language?: string; page?: number }) {
    const response = await apiClient.get('/movie-search/search', { params });
    return response.data;
  },

  async getMovieDetails(tmdbId: number) {
    const response = await apiClient.get(`/movie-search/movie/${tmdbId}`);
    return response.data;
  },

  async getPopular(params?: { page?: number }) {
    const response = await apiClient.get('/movie-search/popular', { params });
    return response.data;
  },

  async getTollywood(params?: { page?: number; language?: string }) {
    const response = await apiClient.get('/movie-search/tollywood', { params });
    return response.data;
  },

  async getByGenre(genreId: number, params?: { page?: number; language?: string }) {
    const response = await apiClient.get(`/movie-search/genre/${genreId}`, { params });
    return response.data;
  },

  async importMovie(tmdbId: number) {
    const response = await apiClient.post(`/movie-search/import/${tmdbId}`);
    return response.data;
  },

  async getPersonDetails(personId: number) {
    const response = await apiClient.get(`/movie-search/person/${personId}`);
    return response.data;
  },
};

// Users Service
export const usersService = {
  async getById(userId: string, currentUserId?: string) {
    const params = currentUserId ? { userId: currentUserId } : {};
    const response = await apiClient.get(`/users/${userId}`, { params });
    return response.data;
  },

  async getFollowers(userId: string, params?: { page?: number; limit?: number }) {
    const response = await apiClient.get(`/users/${userId}/followers`, { params });
    return response.data;
  },

  async getFollowing(userId: string, params?: { page?: number; limit?: number }) {
    const response = await apiClient.get(`/users/${userId}/following`, { params });
    return response.data;
  },

  async getFollowStatus(userId: string) {
    const response = await apiClient.get(`/users/${userId}/follow-status`);
    return response.data;
  },

  async follow(userId: string) {
    const response = await apiClient.post(`/users/${userId}/follow`);
    return response.data;
  },

  async unfollow(userId: string) {
    const response = await apiClient.delete(`/users/${userId}/follow`);
    return response.data;
  },

  async getSettings(userId: string) {
    const response = await apiClient.get(`/users/${userId}/settings`);
    return response.data;
  },

  async updateSettings(userId: string, settings: {
    darkMode?: boolean;
    autoPlayTrailers?: boolean;
    reviewNotifications?: boolean;
    newMovieNotifications?: boolean;
    watchlistNotifications?: boolean;
    weeklyDigest?: boolean;
    profilePublic?: boolean;
    watchlistPublic?: boolean;
    showEmail?: boolean;
  }) {
    const response = await apiClient.put(`/users/${userId}/settings`, settings);
    return response.data;
  },
};

// Notifications Service
export const notificationsService = {
  async getAll(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  async getPreferences() {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  async updatePreferences(preferences: {
    reviewNotifications?: boolean;
    newMovieNotifications?: boolean;
    watchlistNotifications?: boolean;
    weeklyDigest?: boolean;
  }) {
    const response = await apiClient.post('/notifications/preferences', preferences);
    return response.data;
  },

  async markAsRead(notificationId: string) {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  async delete(notificationId: string) {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  async registerToken(token: string, platform: 'ios' | 'android' | 'web', deviceId?: string, appVersion?: string) {
    const response = await apiClient.post('/notifications/register-token', {
      token,
      platform,
      deviceId,
      appVersion,
    });
    return response.data;
  },

  async unregisterToken(token: string) {
    const response = await apiClient.delete(`/notifications/register-token/${token}`);
    return response.data;
  },
};
