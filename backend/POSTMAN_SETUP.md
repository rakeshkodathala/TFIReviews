# Postman Collection Setup Guide

This guide will help you import and use the TFI Reviews API Postman collection.

## 📦 Files Included

1. **TFIReviews_API.postman_collection.json** - Complete API collection with all endpoints
2. **TFIReviews_API.postman_environment.json** - Environment variables for easy testing

## 🚀 Quick Start

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **TFIReviews_API.postman_collection.json**
4. Click **Import**

### Step 2: Import Environment

1. Click **Import** button again
2. Select **TFIReviews_API.postman_environment.json**
3. Click **Import**
4. Select the environment **"TFI Reviews API - Local"** from the dropdown (top right)

### Step 3: Start Your Backend Server

Make sure your backend is running:
```bash
cd backend
npm run dev
```

The server should be running on `http://localhost:3000`

## 📋 Collection Structure

The collection is organized into folders:

### 1. **Health Check**
- `GET /api/health` - Check API status

### 2. **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

**Note:** Both login and register automatically save the `auth_token` and `user_id` to environment variables.

### 3. **Movies**
- `GET /api/movies` - Get all movies (with filters)
- `GET /api/movies` - Search movies
- `GET /api/movies` - Filter by genre
- `GET /api/movies/:id` - Get movie by ID
- `POST /api/movies` - Create new movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

### 4. **Reviews**
- `GET /api/reviews/movie/:movieId` - Get reviews for a movie
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews` - Create new review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

## 🔄 Workflow Example

### 1. Test Health Check
- Run `GET /api/health` to verify server is running

### 2. Register/Login
- Run `POST /api/auth/register` or `POST /api/auth/login`
- The `auth_token` and `user_id` will be automatically saved

### 3. Create a Movie
- Run `POST /api/movies` with movie data
- Copy the `_id` from response and set it as `movie_id` in environment

### 4. Create a Review
- Run `POST /api/reviews`
- Use `{{movie_id}}` and `{{user_id}}` variables
- The review ID will be automatically saved

### 5. View Reviews
- Run `GET /api/reviews/movie/:movieId` using `{{movie_id}}`

## 🔧 Environment Variables

The collection uses these variables:

- `{{base_url}}` - API base URL (default: http://localhost:3000)
- `{{auth_token}}` - JWT token (auto-set after login/register)
- `{{user_id}}` - User ID (auto-set after login/register)
- `{{movie_id}}` - Movie ID (set manually after creating a movie)
- `{{review_id}}` - Review ID (auto-set after creating a review)

## 📝 Example Request Bodies

### Register User
```json
{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
}
```

### Create Movie
```json
{
    "title": "Baahubali: The Beginning",
    "titleTelugu": "బాహుబలి: ది బిగినింగ్",
    "director": "S.S. Rajamouli",
    "cast": ["Prabhas", "Rana Daggubati", "Anushka Shetty", "Tamannaah"],
    "releaseDate": "2015-07-10",
    "genre": ["Action", "Drama", "Epic"],
    "posterUrl": "https://example.com/poster.jpg",
    "trailerUrl": "https://example.com/trailer.mp4",
    "synopsis": "Movie synopsis here..."
}
```

### Create Review
```json
{
    "movieId": "{{movie_id}}",
    "userId": "{{user_id}}",
    "rating": 9,
    "title": "Amazing Movie!",
    "review": "This is one of the best Tollywood movies I've ever seen."
}
```

## 🎯 Tips

1. **Use Environment Variables**: Always use `{{variable_name}}` syntax for dynamic values
2. **Auto-saved Variables**: Login/Register automatically saves tokens and user IDs
3. **Test Scripts**: Some requests have test scripts that auto-save response values
4. **Change Base URL**: Update `base_url` in environment for different servers (dev, staging, prod)

## 🔐 Adding Authentication Headers

Currently, the API doesn't require authentication headers, but when you add auth middleware, you can add this header to requests:

```
Authorization: Bearer {{auth_token}}
```

## 📚 Additional Resources

- Check `backend/README.md` for API documentation
- See `backend/src/routes/` for route implementations
- Check `backend/src/types/` for TypeScript interfaces
