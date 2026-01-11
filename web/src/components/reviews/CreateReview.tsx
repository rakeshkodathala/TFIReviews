import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { reviewsService } from '../../services/api';
import './CreateReview.css';

const CreateReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const movie = location.state?.movie;
  
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!movie) {
    return <div>Movie not found</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!review.trim()) {
      setError('Please write a review');
      return;
    }

    try {
      setLoading(true);
      const reviewData: any = {
        rating,
        review: review.trim(),
      };

      if (title.trim()) {
        reviewData.title = title.trim();
      }

      if (movie.tmdbId) {
        reviewData.tmdbId = movie.tmdbId;
      } else if (movie._id) {
        reviewData.movieId = movie._id;
      }

      await reviewsService.create(reviewData);
      navigate(`/movies/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-review-container">
      <div className="create-review-card">
        <h1>Write a Review</h1>
        <h2 className="movie-title">{movie.title}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rating *</label>
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rating-button ${rating === value ? 'active' : ''}`}
                  onClick={() => setRating(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Review Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Amazing Movie!"
            />
          </div>

          <div className="form-group">
            <label>Your Review *</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Write your review here..."
              rows={8}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateReview;
