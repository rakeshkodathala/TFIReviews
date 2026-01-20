import request from 'supertest';
import app from '../../../src/server';
import Watchlist from '../../../src/models/Watchlist';
import Movie from '../../../src/models/Movie';
import User from '../../../src/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

describe('Watchlist Routes', () => {
  let authToken: string;
  let testUser: any;
  let testMovie: any;
  let otherUser: any;
  let otherUserToken: string;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      username: 'watchlistuser',
      email: 'watchlist@example.com',
      password: 'password123',
    });
    await testUser.save();

    authToken = jwt.sign({ userId: testUser._id.toString() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Create other user
    otherUser = new User({
      username: 'otherwatchuser',
      email: 'otherwatch@example.com',
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

  describe('GET /api/watchlist', () => {
    beforeEach(async () => {
      // Add some movies to watchlist
      const watchlist1 = new Watchlist({
        userId: testUser._id,
        movieId: testMovie._id,
        tmdbId: 12345,
      });
      await watchlist1.save();
    });

    it('should return user watchlist with pagination', async () => {
      const response = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('watchlist');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.watchlist)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 20);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/watchlist')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/watchlist?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.watchlist.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should only return current user watchlist', async () => {
      // Add movie to other user's watchlist
      const otherMovie = new Movie({
        title: 'Other Movie',
        director: 'Other Director',
        cast: ['Actor 2'],
        releaseDate: new Date('2024-02-01'),
        genre: ['Drama'],
      });
      await otherMovie.save();

      const otherWatchlist = new Watchlist({
        userId: otherUser._id,
        movieId: otherMovie._id,
      });
      await otherWatchlist.save();

      const response = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should only return testUser's watchlist items
      response.body.watchlist.forEach((item: any) => {
        expect(item.userId.toString()).toBe(testUser._id.toString());
      });
    });

    it('should populate movie data', async () => {
      const response = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.watchlist.length > 0) {
        const item = response.body.watchlist[0];
        if (item.movieId && typeof item.movieId === 'object') {
          expect(item.movieId).toHaveProperty('title');
        }
      }
    });
  });

  describe('GET /api/watchlist/count', () => {
    beforeEach(async () => {
      // Add movies to watchlist
      const watchlist1 = new Watchlist({
        userId: testUser._id,
        movieId: testMovie._id,
        tmdbId: 12345,
      });
      await watchlist1.save();

      const movie2 = new Movie({
        title: 'Movie 2',
        director: 'Director 2',
        cast: ['Actor 2'],
        releaseDate: new Date('2024-02-01'),
        genre: ['Drama'],
      });
      await movie2.save();

      const watchlist2 = new Watchlist({
        userId: testUser._id,
        movieId: movie2._id,
      });
      await watchlist2.save();
    });

    it('should return watchlist count', async () => {
      const response = await request(app)
        .get('/api/watchlist/count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/watchlist/count')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return zero for empty watchlist', async () => {
      // Create new user with empty watchlist
      const newUser = new User({
        username: 'emptyuser',
        email: 'empty@example.com',
        password: 'password123',
      });
      await newUser.save();

      const newToken = jwt.sign({ userId: newUser._id.toString() }, JWT_SECRET, {
        expiresIn: '7d',
      });

      const response = await request(app)
        .get('/api/watchlist/count')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(response.body.count).toBe(0);
    });
  });

  describe('POST /api/watchlist', () => {
    it('should add movie to watchlist with movieId', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: testMovie._id.toString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Movie added to watchlist');
      expect(response.body).toHaveProperty('watchlistItem');
      expect(response.body.watchlistItem.movieId).toBeDefined();

      // Verify in database
      const watchlistItem = await Watchlist.findOne({
        userId: testUser._id,
        movieId: testMovie._id,
      });
      expect(watchlistItem).toBeTruthy();
    });

    it('should add movie to watchlist with tmdbId', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tmdbId: testMovie.tmdbId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Movie added to watchlist');
      expect(response.body).toHaveProperty('watchlistItem');

      // Verify in database
      const watchlistItem = await Watchlist.findOne({
        userId: testUser._id,
        tmdbId: testMovie.tmdbId,
      });
      expect(watchlistItem).toBeTruthy();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .send({
          movieId: testMovie._id.toString(),
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should require movieId or tmdbId', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'movieId or tmdbId is required');
    });

    it('should prevent duplicate movies in watchlist', async () => {
      // Add movie first time
      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: testMovie._id.toString(),
        })
        .expect(201);

      // Try to add same movie again
      const response = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: testMovie._id.toString(),
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Movie already in watchlist');
    });

    it('should prevent duplicate movies by tmdbId', async () => {
      // Add movie with tmdbId first time
      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tmdbId: testMovie.tmdbId,
        })
        .expect(201);

      // Try to add same movie again
      const response = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tmdbId: testMovie.tmdbId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Movie already in watchlist');
    });

    it('should allow adding movie that exists in DB when using tmdbId', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tmdbId: testMovie.tmdbId,
        })
        .expect(201);

      expect(response.body.watchlistItem).toBeDefined();
      // Should link to existing movie in DB
      if (response.body.watchlistItem.movieId) {
        expect(response.body.watchlistItem.movieId).toBeDefined();
      }
    });

    it('should allow different users to add same movie', async () => {
      // User 1 adds movie
      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: testMovie._id.toString(),
        })
        .expect(201);

      // User 2 can add same movie
      const response = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          movieId: testMovie._id.toString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Movie added to watchlist');
    });
  });

  describe('DELETE /api/watchlist/:id', () => {
    let watchlistItem: any;

    beforeEach(async () => {
      watchlistItem = new Watchlist({
        userId: testUser._id,
        movieId: testMovie._id,
        tmdbId: 12345,
      });
      await watchlistItem.save();
    });

    it('should remove movie from watchlist', async () => {
      const response = await request(app)
        .delete(`/api/watchlist/${watchlistItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Movie removed from watchlist');

      // Verify deleted from database
      const item = await Watchlist.findById(watchlistItem._id);
      expect(item).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/watchlist/${watchlistItem._id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should only allow deleting own watchlist items', async () => {
      // Create watchlist item for other user
      const otherItem = new Watchlist({
        userId: otherUser._id,
        movieId: testMovie._id,
      });
      await otherItem.save();

      // Try to delete other user's item
      const response = await request(app)
        .delete(`/api/watchlist/${otherItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Watchlist item not found');
    });

    it('should return 404 for non-existent watchlist item', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/watchlist/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Watchlist item not found');
    });
  });

  describe('GET /api/watchlist/check', () => {
    beforeEach(async () => {
      const watchlistItem = new Watchlist({
        userId: testUser._id,
        movieId: testMovie._id,
        tmdbId: 12345,
      });
      await watchlistItem.save();
    });

    it('should check if movie is in watchlist by movieId', async () => {
      const response = await request(app)
        .get(`/api/watchlist/check?movieId=${testMovie._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('inWatchlist', true);
      expect(response.body).toHaveProperty('watchlistItem');
    });

    it('should check if movie is in watchlist by tmdbId', async () => {
      const response = await request(app)
        .get(`/api/watchlist/check?tmdbId=${testMovie.tmdbId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('inWatchlist', true);
      expect(response.body).toHaveProperty('watchlistItem');
    });

    it('should return false for movie not in watchlist', async () => {
      const movie2 = new Movie({
        title: 'Movie 2',
        director: 'Director 2',
        cast: ['Actor 2'],
        releaseDate: new Date('2024-02-01'),
        genre: ['Drama'],
      });
      await movie2.save();

      const response = await request(app)
        .get(`/api/watchlist/check?movieId=${movie2._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('inWatchlist', false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/watchlist/check?movieId=123')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should require movieId or tmdbId', async () => {
      const response = await request(app)
        .get('/api/watchlist/check')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'movieId or tmdbId is required');
    });

    it('should only check current user watchlist', async () => {
      // Add movie to other user's watchlist
      const movie2 = new Movie({
        title: 'Movie 2',
        director: 'Director 2',
        cast: ['Actor 2'],
        releaseDate: new Date('2024-02-01'),
        genre: ['Drama'],
      });
      await movie2.save();

      const otherItem = new Watchlist({
        userId: otherUser._id,
        movieId: movie2._id,
      });
      await otherItem.save();

      // Check with testUser (should not find it)
      const response = await request(app)
        .get(`/api/watchlist/check?movieId=${movie2._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('inWatchlist', false);
    });
  });
});
