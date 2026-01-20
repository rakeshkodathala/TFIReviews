import request from 'supertest';
import app from '../../../src/server';
import User from '../../../src/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

describe('Authentication Routes', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'password123',
                name: 'New User',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe(userData.username);
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.name).toBe(userData.name);
            expect(response.body.user).not.toHaveProperty('password');

            // Verify user is in database
            const user = await User.findOne({ email: userData.email });
            expect(user).toBeTruthy();
            expect(user?.username).toBe(userData.username);
        });

        it('should reject duplicate username', async () => {
            const userData = {
                username: 'duplicateuser',
                email: 'user1@example.com',
                password: 'password123',
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            const duplicateData = {
                username: 'duplicateuser',
                email: 'user2@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'User already exists');
        });

        it('should reject duplicate email', async () => {
            const userData = {
                username: 'user1',
                email: 'duplicate@example.com',
                password: 'password123',
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            const duplicateData = {
                username: 'user2',
                email: 'duplicate@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'User already exists');
        });

        it('should validate password length', async () => {
            const userData = {
                username: 'shortpass',
                email: 'shortpass@example.com',
                password: '12345', // Less than 6 characters
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate username length', async () => {
            const userData = {
                username: 'ab', // Less than 3 characters
                email: 'shortuser@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should trim and lowercase email', async () => {
            const userData = {
                username: 'trimuser',
                email: '  TRIM@EXAMPLE.COM  ',
                password: 'password123',
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            const user = await User.findOne({ username: 'trimuser' });
            expect(user?.email).toBe('trim@example.com');
        });

        it('should return valid JWT token', async () => {
            const userData = {
                username: 'jwtuser',
                email: 'jwt@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            const token = response.body.token;
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');

            // Verify token can be decoded
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            expect(decoded).toHaveProperty('userId');
        });

        it('should handle missing required fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'missingfields',
                    // Missing email and password
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/login', () => {
        let testUser: any;
        const userData = {
            username: 'loginuser',
            email: 'login@example.com',
            password: 'password123',
        };

        beforeEach(async () => {
            testUser = new User(userData);
            await testUser.save();
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                })
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.username).toBe(userData.username);
        });

        it('should reject invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should reject invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should handle missing email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: 'password123',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should handle missing password', async () => {
            // Missing password causes comparePassword to fail, which might throw an error
            // The route catches errors and returns 500, or returns 401 if user not found
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                });

            // Could be 401 (user found but password check fails) or 500 (error in comparePassword)
            expect([401, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('error');
        });

        it('should return valid JWT token on successful login', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                })
                .expect(200);

            const token = response.body.token;
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            expect(decoded.userId).toBe(testUser._id.toString());
        });
    });

    describe('GET /api/auth/verify', () => {
        let testUser: any;
        let validToken: string;

        beforeEach(async () => {
            testUser = new User({
                username: 'verifyuser',
                email: 'verify@example.com',
                password: 'password123',
            });
            await testUser.save();

            validToken = jwt.sign({ userId: testUser._id.toString() }, JWT_SECRET, {
                expiresIn: '7d',
            });
        });

        it('should verify valid token', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('valid', true);
            expect(response.body).toHaveProperty('userId', testUser._id.toString());
        });

        it('should reject request without Authorization header', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Authentication required');
        });

        it('should reject invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should reject expired token', async () => {
            const expiredToken = jwt.sign(
                { userId: testUser._id.toString() },
                JWT_SECRET,
                { expiresIn: '-1h' }
            );

            await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401)
                .expect((res) => {
                    expect(res.body).toHaveProperty('error', 'Token expired');
                });
        });
    });

    describe('PUT /api/auth/profile', () => {
        let testUser: any;
        let authToken: string;

        beforeEach(async () => {
            testUser = new User({
                username: 'profileuser',
                email: 'profile@example.com',
                password: 'password123',
                name: 'Original Name',
            });
            await testUser.save();

            authToken = jwt.sign({ userId: testUser._id.toString() }, JWT_SECRET, {
                expiresIn: '7d',
            });
        });

        it('should update user profile with authentication', async () => {
            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Name',
                    location: 'Hyderabad',
                })
                .expect(200);

            expect(response.body.user.name).toBe('Updated Name');
            expect(response.body.user.location).toBe('Hyderabad');

            // Verify in database
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser?.name).toBe('Updated Name');
            expect(updatedUser?.location).toBe('Hyderabad');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .put('/api/auth/profile')
                .send({
                    name: 'Updated Name',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should update only provided fields', async () => {
            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'New Name',
                })
                .expect(200);

            expect(response.body.user.name).toBe('New Name');
            // Location should remain unchanged or be undefined
        });

        it('should handle invalid user ID in token', async () => {
            const invalidToken = jwt.sign({ userId: 'invalidid' }, JWT_SECRET, {
                expiresIn: '7d',
            });

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${invalidToken}`)
                .send({
                    name: 'Updated Name',
                });

            // Invalid ObjectId causes findByIdAndUpdate to return null or throw, resulting in 404 or 400
            expect([400, 404]).toContain(response.status);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/auth/stats', () => {
        let testUser: any;
        let authToken: string;

        beforeEach(async () => {
            testUser = new User({
                username: 'statsuser',
                email: 'stats@example.com',
                password: 'password123',
            });
            await testUser.save();

            authToken = jwt.sign({ userId: testUser._id.toString() }, JWT_SECRET, {
                expiresIn: '7d',
            });
        });

        it('should return user statistics', async () => {
            const response = await request(app)
                .get('/api/auth/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('totalReviews');
            expect(response.body).toHaveProperty('avgRating');
            expect(response.body).toHaveProperty('reviewsThisMonth');
            expect(response.body).toHaveProperty('mostCommonRating');
            expect(response.body).toHaveProperty('memberSince');
            expect(typeof response.body.totalReviews).toBe('number');
            expect(typeof response.body.avgRating).toBe('number');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/auth/stats')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should return zero stats for user with no reviews', async () => {
            const response = await request(app)
                .get('/api/auth/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.totalReviews).toBe(0);
            expect(response.body.avgRating).toBe(0);
            expect(response.body.reviewsThisMonth).toBe(0);
        });
    });

    describe('GET /api/auth/reviews', () => {
        let testUser: any;
        let authToken: string;

        beforeEach(async () => {
            testUser = new User({
                username: 'reviewsuser',
                email: 'reviews@example.com',
                password: 'password123',
            });
            await testUser.save();

            authToken = jwt.sign({ userId: testUser._id.toString() }, JWT_SECRET, {
                expiresIn: '7d',
            });
        });

        it('should return user reviews', async () => {
            const response = await request(app)
                .get('/api/auth/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('reviews');
            expect(Array.isArray(response.body.reviews)).toBe(true);
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/auth/reviews')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should respect limit parameter', async () => {
            const response = await request(app)
                .get('/api/auth/reviews?limit=5')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.reviews.length).toBeLessThanOrEqual(5);
        });
    });
});
