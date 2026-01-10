# TFI Reviews Backend API

TypeScript backend for TFI Reviews - Tollywood Movie Reviews App

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tfireviews
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Start Development Server

```bash
npm run dev
```

This uses `ts-node-dev` for hot reloading during development.

### 4. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/          # Mongoose models (User, Movie, Review)
│   ├── routes/          # Express routes (movies, reviews, auth)
│   ├── middleware/      # Custom middleware (auth)
│   ├── types/           # TypeScript interfaces and types
│   └── server.ts        # Express server entry point
├── dist/                # Compiled JavaScript (generated)
├── tsconfig.json        # TypeScript configuration
└── package.json
```

## 📡 API Endpoints

### Movies
- `GET /api/movies` - Get all movies (with pagination, search, filters)
- `GET /api/movies/:id` - Get movie by ID
- `POST /api/movies` - Create new movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

### Reviews
- `GET /api/reviews/movie/:movieId` - Get reviews for a movie
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews` - Create new review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Health Check
- `GET /api/health` - API health status

## 🔧 Technologies

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📝 TypeScript Features

- Strict type checking
- Interface definitions for all models
- Type-safe request/response handling
- Full IntelliSense support
