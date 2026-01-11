import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { moviesService, movieSearchService } from '../../services/api';
import './Movies.css';

interface Movie {
  _id?: string;
  id?: string;
  title: string;
  posterUrl?: string;
  rating?: number;
  releaseDate?: string;
  tmdbId?: number;
}

const Movies: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const dbMovies = await moviesService.getAll({ limit: 20 });
      if (dbMovies.movies && dbMovies.movies.length > 0) {
        setMovies(dbMovies.movies);
      } else {
        const popular = await movieSearchService.getTollywood({ page: 1 });
        setMovies(popular.movies || []);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      try {
        const popular = await movieSearchService.getTollywood({ page: 1 });
        setMovies(popular.movies || []);
      } catch (err) {
        console.error('Error loading popular movies:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMovies();
      return;
    }

    try {
      setLoading(true);
      const results = await movieSearchService.search({
        query: searchQuery,
        language: 'te',
      });
      setMovies(results.movies || []);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && movies.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading movies...</p>
      </div>
    );
  }

  return (
    <div className="movies-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          Search
        </button>
      </div>

      {movies.length === 0 ? (
        <div className="empty-state">
          <p>No movies found</p>
        </div>
      ) : (
        <div className="movies-grid">
          {movies.map((movie) => (
            <div
              key={movie.tmdbId || movie._id || movie.id}
              className="movie-card"
              onClick={() => navigate(`/movies/${movie.tmdbId || movie._id || movie.id}`, { state: { movie } })}
            >
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />
              ) : (
                <div className="movie-poster-placeholder">
                  <span>No Image</span>
                </div>
              )}
              <div className="movie-info">
                <h3 className="movie-title">{movie.title}</h3>
                {movie.rating && (
                  <p className="movie-rating">⭐ {movie.rating.toFixed(1)}</p>
                )}
                {movie.releaseDate && (
                  <p className="movie-date">
                    {new Date(movie.releaseDate).getFullYear()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Movies;
