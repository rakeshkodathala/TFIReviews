# Database Guide - How Movies Are Stored

## 📊 Database Overview

**Database Name:** `tfireviews`  
**Database Type:** MongoDB  
**Connection:** `mongodb://localhost:27017/tfireviews`

---

## 🎬 How Movies Are Stored

### Storage Mechanism

Movies are stored in MongoDB using Mongoose ODM. Here's how it works:

1. **Auto-Import When Reviewing:**
   - When you create a review with `tmdbId`, the system checks if the movie exists
   - If not found, it automatically fetches from TMDB and saves to your database
   - This ensures only movies with reviews are stored (efficient storage)

2. **Manual Import:**
   - You can also manually import movies using `POST /api/movie-search/import/:tmdbId`

3. **Movie Schema:**
   ```javascript
   {
     title: String (required),
     titleTelugu: String (optional),
     director: String (required),
     cast: [String],
     releaseDate: Date (required),
     genre: [String],
     posterUrl: String,
     trailerUrl: String,
     synopsis: String,
     rating: Number (0-10, calculated from reviews),
     totalReviews: Number (count of reviews),
     tmdbId: Number (unique, from TMDB),
     createdAt: Date,
     updatedAt: Date
   }
   ```

### Collections in Database

Your database has 3 main collections:

1. **`movies`** - All imported movies
2. **`reviews`** - User reviews
3. **`users`** - User accounts

---

## 🔍 How to Check the Database

### Method 1: Using MongoDB Shell (mongosh) - Recommended

#### Step 1: Connect to MongoDB

```bash
mongosh
```

Or connect directly to your database:
```bash
mongosh tfireviews
```

#### Step 2: View All Collections

```javascript
show collections
```

Expected output:
```
movies
reviews
users
```

#### Step 3: View All Movies

```javascript
// Count movies
db.movies.countDocuments()

// Get all movies
db.movies.find().pretty()

// Get first movie
db.movies.findOne()

// Get movie by TMDB ID
db.movies.findOne({ tmdbId: 1511417 })
```

#### Step 4: View All Reviews

```javascript
// Count reviews
db.reviews.countDocuments()

// Get all reviews
db.reviews.find().pretty()

// Get reviews with populated movie info
db.reviews.find().limit(5).pretty()
```

#### Step 5: View All Users

```javascript
// Count users
db.users.countDocuments()

// Get all users (without passwords)
db.users.find({}, { password: 0 }).pretty()
```

#### Step 6: Find Specific Data

```javascript
// Find movie by title
db.movies.find({ title: /bahubali/i })

// Find reviews for a specific movie
db.reviews.find({ movieId: ObjectId("6962ded0819b7ea2b0fb1d61") })

// Find reviews by user
db.reviews.find({ userId: ObjectId("6962dc8b4959eb4adcea5d11") })
```

---

### Method 2: Using the Check Script

I've created a script to quickly check your database:

```bash
cd backend
chmod +x check-database.sh
./check-database.sh
```

This will show:
- ✅ If MongoDB is running
- 📊 Available databases
- 📁 Collections in your database
- 🎬 Movies count
- ⭐ Reviews count
- 👤 Users count
- 📋 Sample movie

---

### Method 3: Using MongoDB Compass (GUI)

1. **Download MongoDB Compass:**
   - https://www.mongodb.com/products/compass

2. **Connect:**
   - Connection String: `mongodb://localhost:27017`
   - Or click "Fill in connection fields individually"
     - Host: `localhost`
     - Port: `27017`

3. **Navigate:**
   - Select `tfireviews` database
   - Click on `movies`, `reviews`, or `users` collections
   - Browse data visually

---

### Method 4: Using API Endpoints

You can also check data via your API:

```bash
# Get all movies
curl http://localhost:3000/api/movies

# Get specific movie
curl http://localhost:3000/api/movies/6962ded0819b7ea2b0fb1d61

# Get all reviews for a movie
curl http://localhost:3000/api/reviews/tmdb/1511417
```

---

## 📋 Common Database Queries

### View Movie Details

```javascript
// In mongosh
use tfireviews
db.movies.findOne({ tmdbId: 1511417 })
```

### Count Documents

```javascript
db.movies.countDocuments()      // Total movies
db.reviews.countDocuments()     // Total reviews
db.users.countDocuments()       // Total users
```

### Find Movies by Genre

```javascript
db.movies.find({ genre: "Action" })
```

### Find Recent Reviews

```javascript
db.reviews.find().sort({ createdAt: -1 }).limit(10)
```

### Find Movies with Reviews

```javascript
db.movies.find({ totalReviews: { $gt: 0 } })
```

### Get Average Rating

```javascript
db.movies.aggregate([
  { $match: { rating: { $gt: 0 } } },
  { $group: { _id: null, avgRating: { $avg: "$rating" } } }
])
```

---

## 🗑️ Database Management

### Delete a Movie

```javascript
// In mongosh
db.movies.deleteOne({ _id: ObjectId("6962ded0819b7ea2b0fb1d61") })
```

### Delete All Movies (⚠️ Careful!)

```javascript
db.movies.deleteMany({})
```

### Delete All Reviews

```javascript
db.reviews.deleteMany({})
```

### Delete All Users (⚠️ Very Careful!)

```javascript
db.users.deleteMany({})
```

### Drop Entire Database (⚠️ DANGEROUS!)

```javascript
use tfireviews
db.dropDatabase()
```

---

## 📊 Database Structure Example

### Movies Collection

```json
{
  "_id": ObjectId("6962ded0819b7ea2b0fb1d61"),
  "title": "Bāhubali: The Epic",
  "titleTelugu": null,
  "director": "S.S. Rajamouli",
  "cast": ["Prabhas", "Rana Daggubati", "Anushka Shetty"],
  "releaseDate": ISODate("2015-07-10T00:00:00.000Z"),
  "genre": ["Action", "Drama", "Epic"],
  "posterUrl": "https://image.tmdb.org/t/p/w500/z9YIo2qscyaXYgRqIdRJtND3bw8.jpg",
  "trailerUrl": "https://www.youtube.com/watch?v=...",
  "synopsis": "In the kingdom of Mahishmati...",
  "rating": 9.0,
  "totalReviews": 1,
  "tmdbId": 1511417,
  "createdAt": ISODate("2026-01-10T23:20:48.194Z"),
  "updatedAt": ISODate("2026-01-10T23:20:48.194Z")
}
```

### Reviews Collection

```json
{
  "_id": ObjectId("6962ded0819b7ea2b0fb1d64"),
  "movieId": ObjectId("6962ded0819b7ea2b0fb1d61"),
  "userId": ObjectId("6962dc8b4959eb4adcea5d11"),
  "rating": 9,
  "title": "Amazing Movie!",
  "review": "This is one of the best Tollywood movies...",
  "likes": 0,
  "createdAt": ISODate("2026-01-10T23:20:48.194Z"),
  "updatedAt": ISODate("2026-01-10T23:20:48.194Z")
}
```

### Users Collection

```json
{
  "_id": ObjectId("6962dc8b4959eb4adcea5d11"),
  "username": "testuser",
  "email": "test@example.com",
  "password": "$2a$10$...",  // Hashed with bcrypt
  "name": "Test User",
  "avatar": null,
  "createdAt": ISODate("2026-01-10T23:15:00.000Z"),
  "updatedAt": ISODate("2026-01-10T23:15:00.000Z")
}
```

---

## 🔗 Relationships

- **Reviews → Movies:** `review.movieId` references `movie._id`
- **Reviews → Users:** `review.userId` references `user._id`
- **Movies → TMDB:** `movie.tmdbId` links to TMDB database

---

## 💡 Tips

1. **Use `.pretty()`** to format JSON output nicely
2. **Use `.limit(5)`** to see only a few documents
3. **Use `.sort({ createdAt: -1 })`** to see newest first
4. **Use `ObjectId("...")`** when searching by ID
5. **Use regex `/pattern/i`** for case-insensitive text search

---

## 🚀 Quick Commands Reference

```bash
# Connect to database
mongosh tfireviews

# View collections
show collections

# Count movies
db.movies.countDocuments()

# View all movies
db.movies.find().pretty()

# View all reviews
db.reviews.find().pretty()

# View all users (without passwords)
db.users.find({}, { password: 0 }).pretty()

# Find specific movie
db.movies.findOne({ tmdbId: 1511417 })

# Find reviews for movie
db.reviews.find({ movieId: ObjectId("6962ded0819b7ea2b0fb1d61") })
```

---

## ✅ Verify Your Data

After creating a review, verify it's stored:

```javascript
// In mongosh
use tfireviews

// Check movie was imported
db.movies.findOne({ tmdbId: 1511417 })

// Check review was created
db.reviews.find().sort({ createdAt: -1 }).limit(1).pretty()

// Check movie rating was updated
db.movies.findOne({ tmdbId: 1511417 }, { rating: 1, totalReviews: 1 })
```

---

That's it! You now know how movies are stored and how to check your database! 🎉
