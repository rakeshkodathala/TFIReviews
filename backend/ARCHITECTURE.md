# TFI Reviews Architecture - Database vs External API

## 🎯 Current Architecture: **Hybrid Approach** (Recommended)

We use a **hybrid approach** that gives you the best of both worlds:

### ✅ What We Store in Database:
- **Reviews** - User reviews and ratings (required)
- **Users** - User accounts and authentication
- **Movies** - Only when imported (for reviews to reference)

### ✅ What We Use from External API (TMDB):
- **Movie Search** - Search and discover movies
- **Movie Details** - Get complete movie information
- **Popular Movies** - Trending movies
- **Tollywood Movies** - Regional movie listings

## 🔄 How It Works

### Scenario 1: Browse Movies (No DB Required)
```
User searches → TMDB API → Returns movie list
```
- No database storage needed
- Always up-to-date
- Fast and efficient

### Scenario 2: Review a Movie (Auto-Import)
```
User wants to review → Provide TMDB ID → Auto-imports movie → Creates review
```
- Movie is automatically imported to DB when first reviewed
- Subsequent reviews use the same movie record
- No manual import needed

## 📊 Data Flow

```
┌─────────────────┐
│   TMDB API      │ ← Search, Browse, Discover
└─────────────────┘
         │
         │ (when reviewing)
         ↓
┌─────────────────┐
│   MongoDB       │ ← Movies (auto-imported)
│                 │ ← Reviews (user-generated)
│                 │ ← Users (authentication)
└─────────────────┘
```

## 🎬 Usage Examples

### 1. Search Movies (No DB)
```bash
GET /api/movie-search/search?query=bahubali
# Returns TMDB movies - no database involved
```

### 2. Create Review (Auto-Import)
```bash
POST /api/reviews
{
  "tmdbId": 350635,  // TMDB ID
  "userId": "user123",
  "rating": 9,
  "review": "Amazing movie!"
}
# Automatically imports movie if not exists, then creates review
```

### 3. Get Reviews for Movie
```bash
GET /api/reviews/tmdb/350635
# Gets reviews for TMDB movie ID 350635
```

## 💡 Benefits of This Approach

✅ **No Manual Import** - Movies auto-import when reviewed  
✅ **Always Fresh Data** - Search uses latest TMDB data  
✅ **Efficient Storage** - Only store movies that have reviews  
✅ **User Reviews** - Can track and display user-generated reviews  
✅ **Rating System** - Calculate ratings from user reviews  

## 🔧 Alternative: Pure External API (No DB)

If you want to use **only** TMDB without any database:

### Pros:
- ✅ No database needed
- ✅ Always up-to-date
- ✅ Simpler architecture

### Cons:
- ❌ **Can't store user reviews** (reviews need movie reference)
- ❌ **Can't calculate ratings** from user reviews
- ❌ **Dependent on TMDB** availability
- ❌ **Rate limiting** issues

### If You Want Pure External API:

You would need to:
1. Store reviews in TMDB (not possible - TMDB doesn't accept user reviews)
2. Use a different service for reviews (like Firebase, Supabase)
3. Or accept that reviews can't be stored

## 🎯 Recommendation

**Keep the hybrid approach** because:
- Reviews are the core feature of your app
- Users need to see other users' reviews
- You need to calculate ratings from reviews
- Auto-import is seamless and efficient

## 📝 Current Implementation

The system is already set up for hybrid approach:

1. **Search/Browse**: Uses TMDB directly (no DB)
2. **Review Creation**: Accepts `tmdbId` → auto-imports movie → creates review
3. **Review Retrieval**: Works with both MongoDB IDs and TMDB IDs

This gives you the flexibility to:
- Browse thousands of movies without storing them
- Only store movies that users actually review
- Keep your database lean and efficient
