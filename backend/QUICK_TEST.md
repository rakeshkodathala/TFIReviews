# Quick Testing Reference

## 🚀 Start Server
```bash
cd backend
npm run dev
```

## 📝 Essential Tests (In Order)

### 1. Health Check
```
GET http://localhost:3000/api/health
```

### 2. Register User
```
POST http://localhost:3000/api/auth/register
Body: {
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```
✅ Saves token automatically

### 3. Search Movies (TMDB)
```
GET http://localhost:3000/api/movie-search/search?query=bahubali
```

### 4. Create Review (Auto-imports Movie)
```
POST http://localhost:3000/api/reviews
Headers: Authorization: Bearer {{auth_token}}
Body: {
  "tmdbId": 1511417,
  "rating": 9,
  "title": "Great Movie!",
  "review": "Amazing cinematography and acting."
}
```

### 5. Get Reviews
```
GET http://localhost:3000/api/reviews/tmdb/1511417
```

### 6. Update Review
```
PUT http://localhost:3000/api/reviews/{{review_id}}
Headers: Authorization: Bearer {{auth_token}}
Body: {
  "rating": 8,
  "review": "Updated review"
}
```

### 7. Get Movies from DB
```
GET http://localhost:3000/api/movies
```

---

## 🔐 Protected Routes (Need Auth Header)

- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/movies` - Create movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

**Header Required:**
```
Authorization: Bearer {{auth_token}}
```

---

## 🌐 Public Routes (No Auth Needed)

- `GET /api/health` - Health check
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/movies` - List movies
- `GET /api/movies/:id` - Get movie
- `GET /api/reviews/movie/:movieId` - Get reviews
- `GET /api/reviews/:id` - Get review
- `GET /api/movie-search/*` - All TMDB search endpoints

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/invalid token | Login/register first |
| 403 Forbidden | Trying to modify others' content | Can only modify your own |
| 404 Not Found | Resource doesn't exist | Check ID is correct |
| 400 Bad Request | Invalid data | Check request body format |

---

## 🎯 Test Flow

1. Health Check ✅
2. Register → Get Token ✅
3. Search TMDB → Find Movie ✅
4. Create Review → Auto-imports Movie ✅
5. View Reviews → See Your Review ✅
6. Update Review → Modify It ✅
7. View Movies → See Imported Movie ✅

Done! 🎉
