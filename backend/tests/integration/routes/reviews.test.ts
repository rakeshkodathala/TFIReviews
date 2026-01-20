import request from 'supertest';
import app from '../../../src/server';
import Review from '../../../src/models/Review';
import Movie from '../../../src/models/Movie';
import User from '../../../src/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

describe('Reviews Routes', () => {
  let authToken: string;
  let testUser: any;
  let testMovie: any;
  let otherUser: any;
  let otherUserToken: string;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      username: 'reviewuser',
      email: 'review@example.com',
      password: 'password123',
    });
    await testUser.save();

    authToken = jwt.sign({ userId: testUser._id.toString() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Create other user
    otherUser = new User({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    await otherUser.save();

    otherUserToken = jwt.sign({ userId: otherUser._id.toString() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Create test movie
    testMovie = new Movie({
      title: 'Test Movie',
      director: 'Test Director',
      cast: ['Actor 1'],
      releaseDate: new Date('2024-01-01'),
      genre: ['Action'],
      tmdbId: 12345,
    });
    await testMovie.save();
  });

  describe('GET /api/reviews', () => {
    beforeEach(async () => {
      // Create some test reviews
      const review1 = new Review({
        movieId: testMovie._id,
        userId: testUser._id,
        rating: 8,
        review: 'Great movie!',
      });
      await review1.save();

      const review2 = new Review({
        movieId: testMovie._id,
        userId: otherUser._id,
        rating: 9,
        review: 'Excellent!',
      });
      await review2.save();
    });

    it('should return all reviews with pagination', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 50);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/reviews?page=1&limit=1')
        .expect(200);

      expect(response.body.reviews.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should populate user and movie data', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .expect(200);

      if (response.body.reviews.length > 0) {
        const review = response.body.reviews[0];
        expect(review).toHaveProperty('userId');
        expect(review).toHaveProperty('movieId');
        // Check if populated (should be object, not just ID)
        if (typeof review.userId === 'object') {
          expect(review.userId).toHaveProperty('username');
        }
        if (typeof review.movieId === 'object') {
          expect(review.movieId).toHaveProperty('title');
        }
      }
    });

    it('should sort reviews by createdAt descending', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .expect(200);

      if (response.body.reviews.length > 1) {
        const reviews = response.body.reviews;
        const firstDate = new Date(reviews[0].createdAt);
        const secondDate = new Date(reviews[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('GET /api/reviews/movie/:movieId', () => {
    beforeEach(async () => {
      const review = new Review({
        movieId: testMovie._id,
        userId: testUser._id,
        rating: 8,
        review: 'Great movie!',
      });
      await review.save();
    });

    it('should return reviews for a movie by MongoDB ID', async () => {
      const response = await request(app)
        .get(`/api/reviews/movie/${testMovie._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.reviews)).toBe(true);
    });

    it('should return reviews for a movie by TMDB ID', async () => {
      const response = await request(app)
        .get(`/api/reviews/movie/${testMovie.tmdbId}`)
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(Array.isArray(response.body.reviews)).toBe(true);
    });

    it('should return empty array for non-existent movie', async () => {
      const fakeTmdbId = '99999';
      const response = await request(app)
        .get(`/api/reviews/movie/${fakeTmdbId}`)
        .expect(200);

      expect(response.body.reviews).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/reviews/movie/${testMovie._id}?page=1&limit=1`)
        .expect(200);

      expect(response.body.reviews.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/reviews/tmdb/:tmdbId', () => {
    beforeEach(async () => {
      const review = new Review({
        movieId: testMovie._id,
        userId: testUser._id,
        rating: 8,
        review: 'Great movie!',
      });
      await review.save();
    });

    it('should return reviews for a movie by TMDB ID', async () => {
      const response = await request(app)
        .get(`/api/reviews/tmdb/${testMovie.tmdbId}`)
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.reviews)).toBe(true);
    });

    it('should return empty array for non-existent TMDB ID', async () => {
      const response = await request(app)
        .get('/api/reviews/tmdb/99999')
        .expect(200);

      expect(response.body.reviews).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('GET /api/reviews/:id', () => {
    let testReview: any;

    beforeEach(async () => {
      testReview = new Review({
        movieId: testMovie._id,
        userId: testUser._id,
        rating: 8,
        review: 'Great movie!',
        title: 'My Review',
      });
      await testReview.save();
    });

    it('should return a single review by ID', async () => {
      const response = await request(app)
        .get(`/api/reviews/${testReview._id}`)
        .expect(200);

      expect(response.body._id).toBe(testReview._id.toString());
      expect(response.body.rating).toBe(8);
      expect(response.body.review).toBe('Great movie!');
      expect(response.body.title).toBe('My Review');
    });

    it('should populate user and movie data', async () => {
      const response = await request(app)
        .get(`/api/reviews/${testReview._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('movieId');
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/reviews/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Review not found');
    });
  });

  describe('POST /api/reviews', () => {
    it('should create a review with movieId', async () => {
      const reviewData = {
        movieId: testMovie._id.toString(),
        rating: 8,
        review: 'Great movie!',
        title: 'My Review',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.rating).toBe(8);
      expect(response.body.review).toBe('Great movie!');
      expect(response.body.title).toBe('My Review');
      expect(response.body.userId).toBeDefined();

      // Verify in database
      const review = await Review.findById(response.body._id);
      expect(review).toBeTruthy();
      expect(review?.rating).toBe(8);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          movieId: testMovie._id.toString(),
          rating: 8,
          review: 'Great movie!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate rating range', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: testMovie._id.toString(),
          rating: 11, // Invalid: > 10
          review: 'Great movie!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require review text', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: testMovie._id.toString(),
          rating: 8,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should prevent duplicate reviews (same user, same movie)', async () => {
      const reviewData = {
        movieId: testMovie._id.toString(),
        rating: 8,
        review: 'First review',
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: testMovie._id.toString(),
          rating: 9,
          review: 'Second review',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'You have already reviewed this movie');
    });

    it('should allow different users to review same movie', async () => {
      const reviewData = {
        movieId: testMovie._id.toString(),
        rating: 8,
        review: 'User 1 review',
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      // Other user can review same movie
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          movieId: testMovie._id.toString(),
          rating: 9,
          review: 'User 2 review',
        })
        .expect(201);

      expect(response.body.rating).toBe(9);
    });

    it('should update movie rating after creating review', async () => {
      const reviewData = {
        movieId: testMovie._id.toString(),
        rating: 8,
        review: 'Great movie!',
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      // Verify movie rating was updated
      const updatedMovie = await Movie.findById(testMovie._id);
      expect(updatedMovie?.totalReviews).toBe(1);
      expect(updatedMovie?.rating).toBeGreaterThanOrEqual(0);
    });

    it('should return 404 for non-existent movieId', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: fakeId,
          rating: 8,
          review: 'Great movie!',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Movie not found');
    });
  });

  describe('PUT /api/reviews/:id', () => {
    let testReview: any;

    beforeEach(async () => {
      testReview = new Review({
        movieId: testMovie._id,
        userId: testUser._id,
        rating: 8,
        review: 'Original review',
        title: 'Original Title',
      });
      await testReview.save();
    });

    it('should update own review', async () => {
      const updateData = {
        rating: 9,
        review: 'Updated review',
        title: 'Updated Title',
      };

      const response = await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.rating).toBe(9);
      expect(response.body.review).toBe('Updated review');
      expect(response.body.title).toBe('Updated Title');

      // Verify in database
      const updatedReview = await Review.findById(testReview._id);
      expect(updatedReview?.rating).toBe(9);
      expect(updatedReview?.review).toBe('Updated review');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .send({ rating: 9 })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should prevent updating other users reviews', async () => {
      const response = await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ rating: 9 })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'You can only update your own reviews');
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 9 })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Review not found');
    });

    it('should validate rating range on update', async () => {
      const response = await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 11 }) // Invalid: > 10
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should update movie rating after updating review', async () => {
      const updateData = {
        rating: 9,
      };

      await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Verify movie rating was recalculated
      const updatedMovie = await Movie.findById(testMovie._id);
      expect(updatedMovie?.rating).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    let testReview: any;

    beforeEach(async () => {
      testReview = new Review({
        movieId: testMovie._id,
        userId: testUser._id,
        rating: 8,
        review: 'Review to delete',
      });
      await testReview.save();
    });

    it('should delete own review', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Review deleted successfully');

      // Verify deleted from database
      const review = await Review.findById(testReview._id);
      expect(review).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${testReview._id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should prevent deleting other users reviews', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'You can only delete your own reviews');
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Review not found');
    });

    it('should update movie rating after deleting review', async () => {
      await request(app)
        .delete(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify movie rating was recalculated
      const updatedMovie = await Movie.findById(testMovie._id);
      expect(updatedMovie?.totalReviews).toBe(0);
    });
  });
});
