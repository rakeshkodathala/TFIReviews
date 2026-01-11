# Backend Testing Guide with Postman

This guide will walk you through testing all the backend endpoints using Postman.

## 🚀 Quick Setup

### Step 1: Start Your Backend Server

```bash
cd backend
npm run dev
```

Make sure MongoDB is running:
```bash
# macOS
brew services start mongodb-community

# Or check if it's running
mongosh
```

### Step 2: Import Postman Collection

1. Open Postman
2. Click **Import** (top left)
3. Select `TFIReviews_API.postman_collection.json`
4. Click **Import**

### Step 3: Import Environment

1. Click **Import** again
2. Select `TFIReviews_API.postman_environment.json`
3. Click **Import**
4. Select **"TFI Reviews API - Local"** from the environment dropdown (top right)

---

## 📋 Testing Workflow

### ✅ Step 1: Health Check

**Request:** `GET /api/health`

- Should return: `{ "status": "OK", "message": "TFI Reviews API is running" }`
- **Status:** No authentication needed

---

### ✅ Step 2: Register a New User

**Request:** `POST /api/auth/register`

**Body:**
```json
{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
}
```

**Expected Response:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "username": "testuser",
        "email": "test@example.com",
        "name": "Test User"
    }
}
```

**✅ What Happens:**
- Token and user_id are automatically saved to environment variables
- You can now use `{{auth_token}}` and `{{user_id}}` in other requests

---

### ✅ Step 3: Login (Alternative to Register)

**Request:** `POST /api/auth/login`

**Body:**
```json
{
    "email": "test@example.com",
    "password": "password123"
}
```

**Expected Response:** Same as register (token + user info)

---

### ✅ Step 4: Search Movies from TMDB

**Request:** `GET /api/movie-search/search?query=bahubali`

**Query Parameters:**
- `query` (required): Search term
- `year` (optional): Filter by year
- `page` (optional): Page number
- `language` (optional): Language code (default: 'te' for Telugu)

**Expected Response:**
```json
{
    "movies": [
        {
            "id": 1511417,
            "title": "Baahubali: The Beginning",
            "director": "S.S. Rajamouli",
            "cast": ["Prabhas", "Rana Daggubati", ...],
            "releaseDate": "2015-07-10",
            "genre": ["Action", "Drama"],
            "posterUrl": "https://image.tmdb.org/...",
            "synopsis": "..."
        }
    ],
    "count": 20
}
```

**✅ Note:** This doesn't require authentication and doesn't save to your database.

---

### ✅ Step 5: Get Movie Details from TMDB

**Request:** `GET /api/movie-search/movie/:tmdbId`

**Example:** `GET /api/movie-search/movie/1511417`

**Expected Response:** Complete movie details with cast, crew, trailers, etc.

---

### ✅ Step 6: Create a Review (Auto-imports Movie)

**Request:** `POST /api/reviews`

**Headers:**
- `Authorization: Bearer {{auth_token}}` (automatically added)

**Body:**
```json
{
    "tmdbId": 1511417,
    "rating": 9,
    "title": "Amazing Movie!",
    "review": "This is one of the best Tollywood movies I've ever seen. The cinematography, acting, and story are all exceptional."
}
```

**✅ What Happens:**
1. Checks if movie exists in your database (by TMDB ID)
2. If not, automatically imports it from TMDB
3. Creates the review (user ID taken from token)
4. Updates movie rating based on all reviews

**Expected Response:**
```json
{
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "movieId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "title": "Baahubali: The Beginning",
        "posterUrl": "...",
        "tmdbId": 1511417
    },
    "userId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "username": "testuser",
        "name": "Test User"
    },
    "rating": 9,
    "title": "Amazing Movie!",
    "review": "...",
    "likes": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**✅ Note:** Review ID is automatically saved to `{{review_id}}` environment variable.

---

### ✅ Step 7: Get Reviews for a Movie

**Request:** `GET /api/reviews/movie/:movieId`

**Option A:** Using MongoDB ID
- `GET /api/reviews/movie/65a1b2c3d4e5f6g7h8i9j0k3`

**Option B:** Using TMDB ID
- `GET /api/reviews/tmdb/1511417`

**Expected Response:**
```json
{
    "reviews": [
        {
            "_id": "...",
            "rating": 9,
            "title": "Amazing Movie!",
            "review": "...",
            "userId": {
                "username": "testuser",
                "name": "Test User"
            },
            "createdAt": "..."
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "pages": 1
    }
}
```

---

### ✅ Step 8: Update Your Review

**Request:** `PUT /api/reviews/:id`

**Headers:**
- `Authorization: Bearer {{auth_token}}`

**Body:**
```json
{
    "rating": 8,
    "review": "Updated review text - still a great movie!"
}
```

**Expected Response:** Updated review object

**✅ Security Test:** Try updating someone else's review - should return 403 Forbidden

---

### ✅ Step 9: Get All Movies from Database

**Request:** `GET /api/movies`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search in title, Telugu title, director
- `genre`: Filter by genre
- `sortBy`: Sort field (default: releaseDate)

**Example:** `GET /api/movies?page=1&limit=20&sortBy=releaseDate`

**Expected Response:**
```json
{
    "movies": [
        {
            "_id": "...",
            "title": "Baahubali: The Beginning",
            "director": "S.S. Rajamouli",
            "rating": 9.0,
            "totalReviews": 1,
            ...
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "pages": 1
    }
}
```

---

### ✅ Step 10: Get Single Movie

**Request:** `GET /api/movies/:id`

**Example:** `GET /api/movies/65a1b2c3d4e5f6g7h8i9j0k3`

**Expected Response:** Complete movie object

---

### ✅ Step 11: Create Movie Manually (Optional)

**Request:** `POST /api/movies`

**Headers:**
- `Authorization: Bearer {{auth_token}}`

**Body:**
```json
{
    "title": "RRR",
    "titleTelugu": "ఆర్ ఆర్ ఆర్",
    "director": "S.S. Rajamouli",
    "cast": ["N.T. Rama Rao Jr.", "Ram Charan", "Alia Bhatt"],
    "releaseDate": "2022-03-25",
    "genre": ["Action", "Drama"],
    "posterUrl": "https://example.com/poster.jpg",
    "synopsis": "A fictional story about two legendary revolutionaries..."
}
```

**Expected Response:** Created movie object

---

### ✅ Step 12: Delete Review

**Request:** `DELETE /api/reviews/:id`

**Headers:**
- `Authorization: Bearer {{auth_token}}`

**Expected Response:**
```json
{
    "message": "Review deleted successfully"
}
```

**✅ Security Test:** Try deleting someone else's review - should return 403 Forbidden

---

## 🔒 Security Testing

### Test 1: Unauthenticated Access
Try creating a review without the Authorization header:
- **Request:** `POST /api/reviews` (no Authorization header)
- **Expected:** `401 Unauthorized` with message "Authentication required"

### Test 2: Invalid Token
Try with an invalid token:
- **Request:** `POST /api/reviews` with `Authorization: Bearer invalid_token`
- **Expected:** `401 Unauthorized` with message "Invalid or expired token"

### Test 3: Update Someone Else's Review
1. Create a review with User A
2. Login as User B
3. Try to update User A's review
- **Expected:** `403 Forbidden` with message "You can only update your own reviews"

### Test 4: Delete Someone Else's Review
Same as Test 3, but with DELETE
- **Expected:** `403 Forbidden` with message "You can only delete your own reviews"

---

## 🎯 Complete Test Scenario

Here's a complete end-to-end test:

1. ✅ **Health Check** - Verify server is running
2. ✅ **Register User** - Create account, get token
3. ✅ **Search TMDB** - Find a movie (e.g., "bahubali")
4. ✅ **Create Review with TMDB ID** - Auto-imports movie, creates review
5. ✅ **Get Reviews** - View reviews for the movie
6. ✅ **Get Movie from DB** - View imported movie
7. ✅ **Update Review** - Modify your review
8. ✅ **Get All Movies** - See all movies in database
9. ✅ **Delete Review** - Remove your review

---

## 🐛 Common Issues

### Issue: "MongoDB connection error"
**Solution:** Make sure MongoDB is running
```bash
brew services start mongodb-community  # macOS
# or
mongod  # Start MongoDB manually
```

### Issue: "Authentication required"
**Solution:** 
- Make sure you've logged in/registered first
- Check that `{{auth_token}}` is set in environment
- Verify Authorization header is present: `Bearer {{auth_token}}`

### Issue: "TMDB API error"
**Solution:**
- Check your `.env` file has TMDB credentials
- Verify `EXTERNAL_MOVIE_API_KEY` and `EXTERNAL_MOVIE_API_TOKEN` are set
- Check TMDB API rate limits (40 requests per 10 seconds)

### Issue: "User already exists"
**Solution:** Use a different email/username or login instead of registering

---

## 📊 Environment Variables

The Postman collection automatically manages these:

- `{{base_url}}` - API base URL (default: http://localhost:3000)
- `{{auth_token}}` - JWT token (auto-set after login/register)
- `{{user_id}}` - User ID (auto-set after login/register)
- `{{movie_id}}` - Movie ID (set after creating/importing movie)
- `{{review_id}}` - Review ID (auto-set after creating review)

---

## ✅ Success Checklist

- [ ] Health check returns OK
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can search movies from TMDB
- [ ] Can create review (auto-imports movie)
- [ ] Can view reviews for a movie
- [ ] Can update own review
- [ ] Cannot update other user's review (403)
- [ ] Can delete own review
- [ ] Cannot delete other user's review (403)
- [ ] Can view movies from database
- [ ] Movie rating updates when reviews change

---

## 🎉 You're Done!

If all tests pass, your backend is working correctly and ready for production use!
