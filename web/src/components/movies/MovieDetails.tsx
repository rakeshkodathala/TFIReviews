import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { movieSearchService, reviewsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './MovieDetails.css';

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [movie, setMovie] = useState(location.state?.movie || null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const initialMovie = location.state?.movie;
    if (initialMovie) {
      setMovie(initialMovie);
      
      // Load movie details only if tmdbId exists
      if (initialMovie.tmdbId) {
        loadMovieDetails(initialMovie.tmdbId);
      } else {
        setLoading(false);
      }
      
      // Load reviews
      loadReviews(initialMovie);
    } else {
      setLoading(false);
      setLoadingReviews(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id, not movie

  const loadMovieDetails = async (tmdbId: number) => {
    try {
      const details = await movieSearchService.getMovieDetails(tmdbId);
      setMovie((prev: any) => ({ ...prev, ...details }));
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (movieData: any) => {
    try {
      setLoadingReviews(true);
      let reviewsData;
      
      if (movieData?.tmdbId) {
        reviewsData = await reviewsService.getByTmdbId(movieData.tmdbId);
      } else if (movieData?._id) {
        reviewsData = await reviewsService.getByMovie(movieData._id);
      }
      
      setReviews(reviewsData?.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      alert('Please login to write a review');
      return;
    }
    navigate(`/movies/${id}/review`, { state: { movie } });
  };

  if (loading || !movie) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  return (
    <div className="movie-details-container">
      <div className="movie-header">
        {movie.posterUrl && (
          <img src={movie.posterUrl} alt={movie.title} className="movie-poster-large" />
        )}
        <div className="movie-header-info">
          <h1>{movie.title}</h1>
          {movie.titleTelugu && <h2 className="title-telugu">{movie.titleTelugu}</h2>}
          
          <div className="movie-meta">
            {movie.rating && (
              <div className="meta-item">
                <span className="meta-label">Rating:</span>
                <span className="meta-value">⭐ {movie.rating.toFixed(1)}</span>
              </div>
            )}
            {movie.releaseDate && (
              <div className="meta-item">
                <span className="meta-label">Release:</span>
                <span className="meta-value">
                  {new Date(movie.releaseDate).getFullYear()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="movie-content">
        {movie.director && (
          <div className="info-section">
            <h3>Director</h3>
            <p>{movie.director}</p>
          </div>
        )}

        {movie.cast && movie.cast.length > 0 && (
          <div className="info-section">
            <h3>Cast</h3>
            <p>{movie.cast.join(', ')}</p>
          </div>
        )}

        {movie.genre && movie.genre.length > 0 && (
          <div className="info-section">
            <h3>Genres</h3>
            <div className="genre-tags">
              {movie.genre.map((g: string, index: number) => (
                <span key={index} className="genre-tag">{g}</span>
              ))}
            </div>
          </div>
        )}

        {movie.description && (
          <div className="info-section">
            <h3>Description</h3>
            <p>{movie.description}</p>
          </div>
        )}

        <button onClick={handleWriteReview} className="btn-primary">
          Write a Review
        </button>

        <div className="reviews-section">
          <h2>Reviews</h2>
          {loadingReviews ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first!</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <span className="review-author">
                      {review.userId?.username || 'Anonymous'}
                    </span>
                    <span className="review-rating">⭐ {review.rating}/10</span>
                  </div>
                  {review.title && (
                    <h4 className="review-title">{review.title}</h4>
                  )}
                  <p className="review-text">{review.review}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
