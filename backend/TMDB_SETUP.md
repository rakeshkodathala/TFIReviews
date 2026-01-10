# TMDB API Integration Setup

Your backend is now configured to use **The Movie Database (TMDB)** API for searching and importing movies.

## 🔑 API Credentials

Your TMDB credentials are already configured:
- **API Key**: `5604dda63af23783d90aef34418e66b8`
- **Access Token**: `eyJhbGciOiJIUzI1NiJ9...` (Bearer token)

## ⚙️ Environment Setup

Add these to your `.env` file in the `backend` directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tfireviews
JWT_SECRET=your-secret-key-change-in-production

# TMDB API Configuration
EXTERNAL_MOVIE_API_URL=https://api.themoviedb.org/3
EXTERNAL_MOVIE_API_KEY=5604dda63af23783d90aef34418e66b8
EXTERNAL_MOVIE_API_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1NjA0ZGRhNjNhZjIzNzgzZDkwYWVmMzQ0MThlNjZiOCIsIm5iZiI6MTc2NzU5NDkwMS4yMjUsInN1YiI6IjY5NWI1Yjk1ZTA5YzRhYmY4ZGNjOTljZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.dtz4uEpA6RPdEGwi5nSMJ__ZVyifODRldgWgaRdfcko
```

## 📡 Available Endpoints

### 1. Search Movies
```
GET /api/movie-search/search?query=bahubali&year=2015&language=en
```

**Query Parameters:**
- `query` (required) - Movie title to search
- `year` (optional) - Filter by release year
- `page` (optional) - Page number (default: 1)
- `language` (optional) - Language code (default: 'en')

**Example:**
```bash
curl "http://localhost:3000/api/movie-search/search?query=bahubali"
```

### 2. Get Movie Details
```
GET /api/movie-search/movie/:tmdbId
```

Fetches complete movie details including:
- Cast and crew
- Director information
- Trailer URL
- Poster images
- Genres
- Synopsis

**Example:**
```bash
curl "http://localhost:3000/api/movie-search/movie/350635"
```

### 3. Get Popular Movies
```
GET /api/movie-search/popular?page=1&language=en
```

**Example:**
```bash
curl "http://localhost:3000/api/movie-search/popular"
```

### 4. Get Tollywood Movies
```
GET /api/movie-search/tollywood?page=1
```

Fetches Telugu movies from India (Tollywood).

**Example:**
```bash
curl "http://localhost:3000/api/movie-search/tollywood"
```

### 5. Import Movie to Database
```
POST /api/movie-search/import/:tmdbId
```

Imports a movie from TMDB into your MongoDB database.

**Example:**
```bash
curl -X POST "http://localhost:3000/api/movie-search/import/350635"
```

## 🎬 Example Workflow

### Step 1: Search for a Movie
```bash
GET /api/movie-search/search?query=bahubali
```

Response will include TMDB movie IDs.

### Step 2: Get Movie Details
```bash
GET /api/movie-search/movie/350635
```

This returns complete movie information.

### Step 3: Import to Database
```bash
POST /api/movie-search/import/350635
```

This saves the movie to your MongoDB database.

### Step 4: Users Can Review
Once imported, users can create reviews using:
```bash
POST /api/reviews
{
  "movieId": "<imported-movie-id>",
  "userId": "<user-id>",
  "rating": 9,
  "review": "Amazing movie!"
}
```

## 📋 Response Format

### Search Results
```json
{
  "movies": [
    {
      "id": 350635,
      "title": "Baahubali: The Beginning",
      "director": "S.S. Rajamouli",
      "cast": ["Prabhas", "Rana Daggubati", "Anushka Shetty"],
      "releaseDate": "2015-07-10",
      "genre": ["Action", "Drama", "Epic"],
      "posterUrl": "https://image.tmdb.org/t/p/w500/...",
      "trailerUrl": "https://www.youtube.com/watch?v=...",
      "synopsis": "In the kingdom of Mahishmati...",
      "rating": 7.8
    }
  ],
  "count": 20
}
```

## 🔍 Features

✅ **Search Movies** - Search TMDB by title, year, language
✅ **Movie Details** - Get complete movie info with cast, crew, trailers
✅ **Popular Movies** - Fetch trending/popular movies
✅ **Tollywood Filter** - Get Telugu movies from India
✅ **Import to DB** - Save movies to your MongoDB database
✅ **Auto-transform** - Converts TMDB format to your database schema

## 🚀 Testing

1. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test search:**
   ```bash
   curl "http://localhost:3000/api/movie-search/search?query=bahubali"
   ```

3. **Import a movie:**
   ```bash
   # First, search to get TMDB ID
   # Then import using that ID
   curl -X POST "http://localhost:3000/api/movie-search/import/350635"
   ```

## 📝 Notes

- TMDB API has rate limits (40 requests per 10 seconds)
- Movie details include cast, director, trailers automatically
- Posters are automatically converted to full URLs
- Trailers are converted to YouTube URLs
- Ratings are converted from TMDB's 0-10 scale

## 🔗 TMDB Documentation

- Official API Docs: https://developers.themoviedb.org/3
- API Base URL: https://api.themoviedb.org/3

## 🎯 Next Steps

1. Add `.env` file with your credentials
2. Restart your backend server
3. Test the search endpoint
4. Import some Tollywood movies
5. Start building your mobile app to use these endpoints!
