import Watchlist from '../../../src/models/Watchlist';
import Movie from '../../../src/models/Movie';
import User from '../../../src/models/User';

describe('Watchlist Model', () => {
    let testMovie: any;
    let testUser: any;

    beforeEach(async () => {
        // Create test movie
        testMovie = new Movie({
            title: 'Test Movie',
            director: 'Test Director',
            cast: ['Actor 1'],
            releaseDate: new Date(),
        });
        await testMovie.save();

        // Create test user
        testUser = new User({
            username: 'watcher',
            email: 'watcher@example.com',
            password: 'password123',
        });
        await testUser.save();
    });

    describe('Schema Validation', () => {
        it('should create a watchlist item with movieId', async () => {
            const watchlistData = {
                userId: testUser._id,
                movieId: testMovie._id,
            };

            const watchlist = new Watchlist(watchlistData);
            const savedWatchlist = await watchlist.save();

            expect(savedWatchlist._id).toBeDefined();
            expect(savedWatchlist.userId.toString()).toBe(testUser._id.toString());
            expect(savedWatchlist.movieId?.toString()).toBe(testMovie._id.toString());
            expect(savedWatchlist.addedAt).toBeDefined();
        });

        it('should create a watchlist item with tmdbId', async () => {
            const watchlistData = {
                userId: testUser._id,
                tmdbId: 12345,
            };

            const watchlist = new Watchlist(watchlistData);
            const savedWatchlist = await watchlist.save();

            expect(savedWatchlist.tmdbId).toBe(12345);
        });

        it('should require userId', async () => {
            const watchlist = new Watchlist({
                movieId: testMovie._id,
            });

            await expect(watchlist.save()).rejects.toThrow();
        });

        it('should have default addedAt timestamp', async () => {
            const watchlist = new Watchlist({
                userId: testUser._id,
                movieId: testMovie._id,
            });

            const savedWatchlist = await watchlist.save();
            expect(savedWatchlist.addedAt).toBeDefined();
            expect(savedWatchlist.addedAt).toBeInstanceOf(Date);
        });
    });

    describe('Unique Constraints', () => {
        it('should prevent duplicate movieId for same user', async () => {
            const watchlist1 = new Watchlist({
                userId: testUser._id,
                movieId: testMovie._id,
            });

            await watchlist1.save();

            const watchlist2 = new Watchlist({
                userId: testUser._id,
                movieId: testMovie._id,
            });

            // The unique index should prevent duplicates
            try {
                await watchlist2.save();
                // If save succeeds, verify only one item exists
                const items = await Watchlist.find({ userId: testUser._id, movieId: testMovie._id });
                expect(items.length).toBe(1);
            } catch (error: any) {
                // If it throws, that's the expected behavior
                expect(error).toBeDefined();
                expect(error.code).toBe(11000); // MongoDB duplicate key error
            }
        });

        it('should prevent duplicate tmdbId for same user', async () => {
            const watchlist1 = new Watchlist({
                userId: testUser._id,
                tmdbId: 12345,
            });

            await watchlist1.save();

            const watchlist2 = new Watchlist({
                userId: testUser._id,
                tmdbId: 12345,
            });

            // The unique index should prevent duplicates
            try {
                await watchlist2.save();
                // If save succeeds, verify only one item exists
                const items = await Watchlist.find({ userId: testUser._id, tmdbId: 12345 });
                expect(items.length).toBe(1);
            } catch (error: any) {
                // If it throws, that's the expected behavior
                expect(error).toBeDefined();
                expect(error.code).toBe(11000); // MongoDB duplicate key error
            }
        });

        it('should allow same movie for different users', async () => {
            const user2 = new User({
                username: 'watcher2',
                email: 'watcher2@example.com',
                password: 'password123',
            });
            await user2.save();

            const watchlist1 = new Watchlist({
                userId: testUser._id,
                movieId: testMovie._id,
            });

            const watchlist2 = new Watchlist({
                userId: user2._id,
                movieId: testMovie._id,
            });

            await watchlist1.save();
            await expect(watchlist2.save()).resolves.toBeDefined();
        });

        it('should allow same user to add different movies', async () => {
            const movie2 = new Movie({
                title: 'Movie 2',
                director: 'Director 2',
                cast: ['Actor 2'],
                releaseDate: new Date(),
                tmdbId: 12346, // Give it a different tmdbId to avoid sparse index conflict
            });
            await movie2.save();

            const watchlist1 = new Watchlist({
                userId: testUser._id,
                movieId: testMovie._id,
                tmdbId: 12345, // Give it a tmdbId to avoid sparse index conflict
            });

            const watchlist2 = new Watchlist({
                userId: testUser._id,
                movieId: movie2._id,
                tmdbId: 12346,
            });

            await watchlist1.save();
            // Should succeed - different movies with different tmdbIds
            const savedWatchlist2 = await watchlist2.save();
            expect(savedWatchlist2._id).toBeDefined();
            expect(savedWatchlist2.movieId?.toString()).toBe(movie2._id.toString());
        });
    });

    describe('Indexes', () => {
        it('should have unique compound index on userId and movieId', async () => {
            const indexes = Watchlist.schema.indexes();
            const movieIdIndex = indexes.find(
                (idx: any) => idx[0] && idx[0].userId === 1 && idx[0].movieId === 1
            );
            expect(movieIdIndex).toBeDefined();
            expect(movieIdIndex && movieIdIndex[1]?.unique).toBe(true);
        });

        it('should have unique compound index on userId and tmdbId', async () => {
            const indexes = Watchlist.schema.indexes();
            const tmdbIdIndex = indexes.find(
                (idx: any) => idx[0] && idx[0].userId === 1 && idx[0].tmdbId === 1
            );
            expect(tmdbIdIndex).toBeDefined();
            expect(tmdbIdIndex && tmdbIdIndex[1]?.unique).toBe(true);
        });
    });

    describe('Timestamps', () => {
        it('should have createdAt and updatedAt', async () => {
            const watchlist = new Watchlist({
                userId: testUser._id,
                movieId: testMovie._id,
            });

            const savedWatchlist = await watchlist.save();
            expect((savedWatchlist as any).createdAt).toBeDefined();
            expect((savedWatchlist as any).updatedAt).toBeDefined();
        });
    });
});
