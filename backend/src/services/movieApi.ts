import axios, { AxiosInstance } from 'axios';

export interface ExternalMovie {
  id: string | number;
  title: string;
  titleTelugu?: string;
  director?: string;
  cast?: string[];
  releaseDate?: string;
  genre?: string[];
  posterUrl?: string;
  trailerUrl?: string;
  synopsis?: string;
  rating?: number;
  [key: string]: any; // For additional fields from external API
}

export interface MovieSearchParams {
  query?: string;
  year?: number;
  page?: number;
  language?: string;
  [key: string]: any;
}

class MovieApiService {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
  private accessToken?: string;

  constructor() {
    // TMDB API configuration
    this.baseUrl = process.env.EXTERNAL_MOVIE_API_URL || 'https://api.themoviedb.org/3';
    this.apiKey = process.env.EXTERNAL_MOVIE_API_KEY || '';
    this.accessToken = process.env.EXTERNAL_MOVIE_API_TOKEN;
    
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
      },
      params: {
        api_key: this.apiKey, // TMDB uses api_key as query parameter
      },
    });
  }

  /**
   * Search for movies using TMDB API
   */
  async searchMovies(params: MovieSearchParams): Promise<ExternalMovie[]> {
    try {
      const { query, year, page = 1, language = 'en', ...otherParams } = params;
      
      if (!query) {
        throw new Error('Query parameter is required');
      }

      const response = await this.apiClient.get('/search/movie', {
        params: {
          query,
          year,
          page,
          language,
          include_adult: false,
          ...otherParams,
        },
      });
      
      return this.transformMovies(response.data);
    } catch (error: any) {
      console.error('Error searching movies:', error.message);
      throw new Error(`Failed to search movies: ${error.message}`);
    }
  }

  /**
   * Get movie details by ID from TMDB API
   * Includes credits (cast, director) and videos (trailer)
   */
  async getMovieById(id: string | number): Promise<ExternalMovie> {
    try {
      // Fetch movie details, credits, and videos separately for better reliability
      const [movieResponse, creditsResponse, videosResponse] = await Promise.all([
        this.apiClient.get(`/movie/${id}`),
        this.apiClient.get(`/movie/${id}/credits`).catch(() => ({ data: { cast: [], crew: [] } })),
        this.apiClient.get(`/movie/${id}/videos`).catch(() => ({ data: { results: [] } })),
      ]);

      const movie = movieResponse.data;
      const credits = creditsResponse.data || { cast: [], crew: [] };
      const videos = videosResponse.data || { results: [] };

      // Combine all data - prioritize separate credits/videos calls
      return this.transformMovie({
        ...movie,
        credits: {
          ...movie.credits, // Fallback to appended credits if separate call failed
          ...credits, // Override with separate credits (more reliable)
        },
        videos: {
          ...movie.videos, // Fallback to appended videos if separate call failed
          ...videos, // Override with separate videos (more reliable)
        },
      });
    } catch (error: any) {
      console.error('Error fetching movie:', error.message);
      throw new Error(`Failed to fetch movie: ${error.message}`);
    }
  }

  /**
   * Get popular movies from TMDB
   */
  async getPopularMovies(params?: MovieSearchParams): Promise<ExternalMovie[]> {
    try {
      const { page = 1, language = 'en', ...otherParams } = params || {};
      
      const response = await this.apiClient.get('/movie/popular', {
        params: {
          page,
          language,
          ...otherParams,
        },
      });
      
      return this.transformMovies(response.data);
    } catch (error: any) {
      console.error('Error fetching popular movies:', error.message);
      throw new Error(`Failed to fetch popular movies: ${error.message}`);
    }
  }

  /**
   * Get movies by region (for Tollywood/Telugu movies)
   */
  async getMoviesByRegion(region: string = 'IN', params?: MovieSearchParams): Promise<ExternalMovie[]> {
    try {
      // Default to English for titles, but allow override
      const { page = 1, language = 'en', ...otherParams } = params || {};
      
      const response = await this.apiClient.get('/discover/movie', {
        params: {
          region,
          language, // Use English to get English titles
          page,
          sort_by: 'popularity.desc',
          with_origin_country: 'IN', // India
          ...otherParams,
        },
      });
      
      return this.transformMovies(response.data);
    } catch (error: any) {
      console.error('Error fetching regional movies:', error.message);
      throw new Error(`Failed to fetch regional movies: ${error.message}`);
    }
  }

  /**
   * Get movies by genre using TMDB discover API
   */
  async getMoviesByGenre(genreId: number, params?: MovieSearchParams): Promise<ExternalMovie[]> {
    try {
      // Default to English for titles, but allow override
      const { page = 1, language = 'en', ...otherParams } = params || {};
      
      // Build params - try with origin country first, but don't make it too restrictive
      const requestParams: any = {
        with_genres: genreId,
        language, // Use English to get English titles
        page,
        sort_by: 'popularity.desc',
        include_adult: false,
        ...otherParams,
      };
      
      // Add origin country filter for Indian movies when searching for regional content
      // But still request English titles
      if (params?.with_origin_country || params?.region === 'IN') {
        requestParams.with_origin_country = 'IN';
      }
      
      const response = await this.apiClient.get('/discover/movie', {
        params: requestParams,
      });
      
      return this.transformMovies(response.data);
    } catch (error: any) {
      console.error('Error fetching movies by genre:', error.message);
      console.error('Error details:', error.response?.data || error);
      throw new Error(`Failed to fetch movies by genre: ${error.message}`);
    }
  }

  /**
   * Transform external API response to our movie format
   * This will need to be customized based on the actual API response structure
   */
  private transformMovies(data: any): ExternalMovie[] {
    // This is a generic transformer - customize based on your API
    if (Array.isArray(data)) {
      return data.map(movie => this.transformMovie(movie));
    }
    
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((movie: any) => this.transformMovie(movie));
    }
    
    if (data.movies && Array.isArray(data.movies)) {
      return data.movies.map((movie: any) => this.transformMovie(movie));
    }
    
    return [];
  }

  /**
   * Transform a single movie from TMDB API to our format
   */
  private transformMovie(movie: any): ExternalMovie {
    // Extract director from credits crew
    const director = movie.credits?.crew?.find((c: any) => 
      c.job === 'Director' || c.department === 'Directing'
    )?.name 
      || movie.director 
      || 'Unknown';

    // Extract cast - prioritize credits.cast, fallback to cast array
    let cast: string[] = [];
    if (movie.credits?.cast && Array.isArray(movie.credits.cast) && movie.credits.cast.length > 0) {
      // Get top 10 cast members
      cast = movie.credits.cast
        .slice(0, 10)
        .map((actor: any) => actor.name || actor.original_name)
        .filter((name: string) => name); // Remove any null/undefined
    } else if (movie.cast && Array.isArray(movie.cast)) {
      cast = movie.cast
        .slice(0, 10)
        .map((actor: any) => (typeof actor === 'string' ? actor : actor.name))
        .filter((name: string) => name);
    }

    // Extract genres
    const genres = movie.genres?.map((g: any) => g.name || g) 
      || movie.genre 
      || [];

    // Extract trailer URL
    const trailer = movie.videos?.results?.find((v: any) => 
      v.type === 'Trailer' && v.site === 'YouTube'
    );
    const trailerUrl = trailer 
      ? `https://www.youtube.com/watch?v=${trailer.key}` 
      : movie.trailerUrl || undefined;

    // Build poster URL
    const posterUrl = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : movie.posterUrl || undefined;

    // Since we're requesting language='en', TMDB should return English titles
    // Use title if available (will be in English), fallback to original_title
    // For non-English movies, original_title might be in native language, so prefer title
    const englishTitle = movie.title || movie.original_title;

    return {
      id: movie.id,
      title: englishTitle,
      titleTelugu: movie.titleTelugu || movie.title_telugu, // May need to fetch from alternative titles
      director,
      cast,
      releaseDate: movie.release_date,
      genre: genres,
      posterUrl,
      trailerUrl,
      synopsis: movie.overview,
      rating: movie.vote_average ? (movie.vote_average / 10) * 10 : undefined, // Convert 0-10 scale
      tmdbId: movie.id,
      originalLanguage: movie.original_language,
      popularity: movie.popularity,
      ...movie, // Include all other fields
    };
  }

  /**
   * Convert external movie to our database format
   */
  convertToDbFormat(externalMovie: ExternalMovie): any {
    return {
      title: externalMovie.title,
      titleTelugu: externalMovie.titleTelugu,
      director: externalMovie.director || 'Unknown',
      cast: Array.isArray(externalMovie.cast) ? externalMovie.cast : [],
      releaseDate: externalMovie.releaseDate 
        ? new Date(externalMovie.releaseDate) 
        : new Date(),
      genre: Array.isArray(externalMovie.genre) ? externalMovie.genre : [],
      posterUrl: externalMovie.posterUrl,
      trailerUrl: externalMovie.trailerUrl,
      synopsis: externalMovie.synopsis || '',
      rating: 0, // Will be calculated from reviews
      totalReviews: 0,
      tmdbId: externalMovie.tmdbId || externalMovie.id, // Store TMDB ID for reference
    };
  }
}

export default new MovieApiService();
