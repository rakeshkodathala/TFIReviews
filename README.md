# 🎬 TFI Reviews

A comprehensive movie review platform focused on Tollywood (Telugu) cinema, built with React Native, React, Node.js, and MongoDB.

![TFI Reviews](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)

## 📱 About

TFI Reviews is a full-stack application that allows users to discover, review, and discuss Tollywood movies. The platform includes:

- **Mobile App** (React Native + Expo) - iOS and Android
- **Web App** (React) - Browser-based experience
- **Backend API** (Node.js + Express + TypeScript) - RESTful API with MongoDB

## ✨ Features

### Core Functionality
- 🔐 User authentication (Login/Register)
- 🎬 Browse and search Tollywood movies
- ⭐ Rate movies (1-10 star system)
- 📝 Write and edit reviews
- 📋 Create and manage watchlists
- 📊 Personalized "For You" recommendations
- 🔥 Trending movies section
- 👤 User profiles with statistics
- 📱 Activity feed

### Technical Features
- 🎨 Modern UI/UX with dark theme
- 🖼️ Optimized image loading
- 🔄 Pull-to-refresh
- 📄 Pagination support
- 🌐 Offline detection
- ⚡ Performance optimizations
- 🎯 TypeScript throughout
- 📱 Responsive design

## 🏗️ Project Structure

```
TFIReviews/
├── backend/          # Node.js + Express + TypeScript API
├── mobile/           # React Native + Expo mobile app
├── web/              # React web application
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn
- Expo CLI (for mobile development)
- TMDB API Key ([Get one here](https://www.themoviedb.org/settings/api))

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Create .env file with your config
npm run dev
```

### Mobile App Setup

```bash
cd mobile
npm install
# Update API URL in src/config/api.ts
npm start
```

### Web App Setup

```bash
cd web
npm install
npm start
```

For detailed setup instructions, see:
- [Backend README](./backend/README.md)
- [Mobile README](./mobile/README.md)
- [Web README](./web/README.md)

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB** + **Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Axios** - HTTP client for TMDB API

### Mobile
- **React Native** - Mobile framework
- **Expo** (SDK 54) - Development platform
- **React Navigation** - Navigation
- **TypeScript** - Type safety
- **Expo Image** - Image optimization
- **Expo Linear Gradient** - UI effects

### Web
- **React** - UI library
- **TypeScript** - Type safety
- **React Router** - Routing
- **Axios** - HTTP client

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/stats` - Get user statistics

### Movies
- `GET /api/movies` - Get all movies (with pagination, search, filters)
- `GET /api/movies/:id` - Get movie by ID
- `POST /api/movies` - Create new movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

### Reviews
- `GET /api/reviews` - Get all reviews (Activity feed)
- `GET /api/reviews/movie/:movieId` - Get reviews for a movie
- `GET /api/reviews/user/:userId` - Get reviews by user
- `POST /api/reviews` - Create new review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Watchlist
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add movie to watchlist
- `DELETE /api/watchlist/:movieId` - Remove from watchlist

### Movie Search (TMDB)
- `GET /api/movie-search/search` - Search TMDB
- `GET /api/movie-search/popular` - Get popular movies
- `GET /api/movie-search/trending` - Get trending movies
- `GET /api/movie-search/:tmdbId` - Get movie details

## 📱 Screenshots

*Add screenshots of your app here*

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of conduct
- Development setup
- Coding standards
- Git workflow
- Pull request process
- Testing guidelines

### Quick Contribution Steps

> **⚠️ Important**: You **must** fork the repository first. You cannot directly push to the main repository.

1. **Fork the repository** on GitHub (creates a copy under your account)
2. **Clone your fork** (not the main repository):
   ```bash
   git clone https://github.com/YOUR_USERNAME/TFIReviews.git
   ```
3. **Create a feature branch** in your fork:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes** and commit:
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
5. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request** from your fork to the main repository

For detailed instructions, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie data
- [Expo](https://expo.dev/) for the development platform
- All contributors who help improve this project

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/TFIReviews/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/TFIReviews/discussions)

## 🗺️ Roadmap

- [ ] Push notifications
- [ ] Social features (follow users, comments)
- [ ] Movie lists/collections
- [ ] Advanced filtering
- [ ] Export reviews
- [ ] Dark/light theme toggle
- [ ] Unit and integration tests
- [ ] Performance optimizations

---

**Made with ❤️ for Tollywood cinema enthusiasts**
