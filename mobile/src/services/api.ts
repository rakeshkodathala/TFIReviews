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
  async getAll(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get('/reviews', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/reviews/${id}`);
    return response.data;
  },

  async getByMovie(movieId: string) {
    const response = await apiClient.get(`/reviews/movie/${movieId}`);
    return response.data;
  },

  async getByTmdbId(tmdbId: number) {
    const response = await apiClient.get(`/reviews/tmdb/${tmdbId}`);
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
};
