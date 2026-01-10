# External Movie API Integration Setup

This guide explains how to configure and use an external movie API for searching and importing movies.

## 📋 Overview

Instead of manually adding movies, the app can search and import movies from an external API. The integration is flexible and can work with various movie APIs.

## 🔧 Configuration

### Step 1: Add Environment Variables

Create or update your `.env` file in the `backend` directory:

```env
# External Movie API Configuration
EXTERNAL_MOVIE_API_URL=https://api.example.com
EXTERNAL_MOVIE_API_KEY=your-api-key-here
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

This will install `axios` for making HTTP requests to the external API.

## 📡 API Endpoints

### Search Movies
```
GET /api/movie-search/search?query=bahubali&year=2015&language=te
```

**Query Parameters:**
- `query` (required) - Search term
- `year` (optional) - Filter by release year
- `page` (optional) - Page number for pagination
- `language` (optional) - Language code (default: 'te' for Telugu)

**Response:**
```json
{
  "movies": [
    {
      "id": "123",
      "title": "Baahubali",
      "titleTelugu": "బాహుబలి",
      "director": "S.S. Rajamouli",
      "cast": ["Prabhas", "Rana Daggubati"],
      "releaseDate": "2015-07-10",
      "genre": ["Action", "Drama"],
      "posterUrl": "https://...",
      "synopsis": "...",
      "rating": 8.5
    }
  ],
  "count": 1
}
```

### Get Movie Details
```
GET /api/movie-search/movie/:externalId
```

### Get Popular Movies
```
GET /api/movie-search/popular?page=1
```

### Import Movie to Database
```
POST /api/movie-search/import/:externalId
```

This will:
1. Fetch movie details from external API
2. Check if movie already exists in database
3. Convert to our database format
4. Save to MongoDB

**Response:**
```json
{
  "message": "Movie imported successfully",
  "movie": { ... }
}
```

## 🔌 Customizing for Your API

The service is designed to be flexible. You'll need to customize the `transformMovie` and `transformMovies` methods in `src/services/movieApi.ts` based on your API's response structure.

### Common API Response Formats

#### Format 1: Array Response
```json
[
  { "id": 1, "title": "Movie 1" },
  { "id": 2, "title": "Movie 2" }
]
```

#### Format 2: Results Object
```json
{
  "results": [
    { "id": 1, "title": "Movie 1" }
  ],
  "total": 100
}
```

#### Format 3: Movies Object
```json
{
  "movies": [
    { "id": 1, "title": "Movie 1" }
  ]
}
```

The current implementation handles all three formats.

## 🎯 Popular Movie APIs

### Option 1: TMDB (The Movie Database)
- **URL**: `https://api.themoviedb.org/3`
- **Free**: Yes (requires API key)
- **Documentation**: https://www.themoviedb.org/documentation/api

### Option 2: OMDB API
- **URL**: `http://www.omdbapi.com`
- **Free**: Limited (requires API key)
- **Documentation**: http://www.omdbapi.com/

### Option 3: Custom Tollywood API
If you have a specific Tollywood movie API, provide the details and I'll help customize it.

## 📝 Example: TMDB Integration

If using TMDB, update `src/services/movieApi.ts`:

```typescript
// In transformMovie method
private transformMovie(movie: any): ExternalMovie {
  return {
    id: movie.id,
    title: movie.title || movie.original_title,
    director: movie.director, // You'll need to fetch from credits endpoint
    cast: movie.cast?.map((c: any) => c.name) || [],
    releaseDate: movie.release_date,
    genre: movie.genres?.map((g: any) => g.name) || [],
    posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    synopsis: movie.overview,
    rating: movie.vote_average,
  };
}
```

## 🚀 Usage Workflow

1. **Search for movies** using `/api/movie-search/search`
2. **View movie details** using `/api/movie-search/movie/:id`
3. **Import to database** using `/api/movie-search/import/:id`
4. **Users can then review** the imported movies

## 🔍 Testing

Test the endpoints using Postman or curl:

```bash
# Search movies
curl "http://localhost:3000/api/movie-search/search?query=bahubali"

# Import a movie
curl -X POST "http://localhost:3000/api/movie-search/import/123"
```

## 📞 Need Help?

Once you provide the API link and documentation, I can:
1. Customize the transformation logic
2. Update the endpoints based on API structure
3. Add authentication if needed
4. Handle pagination and filtering

Just share:
- API base URL
- Authentication method (API key, Bearer token, etc.)
- API documentation or example responses
- Endpoint structure
