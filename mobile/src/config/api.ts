// API Configuration
// For iPhone (Physical Device): use your computer's IP address
export const API_BASE_URL = 'http://10.0.0.244:3000/api';

// For iOS Simulator, use: 'http://localhost:3000/api'
// For Android Emulator, use: 'http://10.0.2.2:3000/api'

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  VERIFY_TOKEN: '/auth/verify',
  
  // Movies
  MOVIES: '/movies',
  MOVIE_BY_ID: (id: string) => `/movies/${id}`,
  
  // Reviews
  REVIEWS: '/reviews',
  REVIEW_BY_ID: (id: string) => `/reviews/${id}`,
  REVIEWS_BY_MOVIE: (movieId: string) => `/reviews/movie/${movieId}`,
  REVIEWS_BY_TMDB: (tmdbId: number) => `/reviews/tmdb/${tmdbId}`,
  
  // Movie Search (TMDB)
  SEARCH_MOVIES: '/movie-search/search',
  MOVIE_DETAILS: (tmdbId: number) => `/movie-search/movie/${tmdbId}`,
  POPULAR_MOVIES: '/movie-search/popular',
  TOLLYWOOD_MOVIES: '/movie-search/tollywood',
  IMPORT_MOVIE: (tmdbId: number) => `/movie-search/import/${tmdbId}`,
  
  // Health
  HEALTH: '/health',
};
