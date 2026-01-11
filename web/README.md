# TFI Reviews - Web App

A React web application for reviewing Tollywood movies.

## 🚀 Quick Start

1. **Start the backend** (in a separate terminal):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the web app**:
   ```bash
   cd web
   npm start
   ```

3. **Open in browser**:
   - The app will automatically open at `http://localhost:3001`
   - Or manually navigate to `http://localhost:3001`

## ✨ Features

- ✅ User authentication (Login/Register)
- ✅ Browse and search Tollywood movies
- ✅ View movie details
- ✅ Create and view reviews
- ✅ Responsive design
- ✅ No React Native bridge issues!

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/          # Login & Register
│   ├── movies/        # Movies list & details
│   └── reviews/       # Create review
├── context/           # AuthContext
├── services/           # API services
└── config/            # API configuration
```

## 🔧 Configuration

The API URL is configured in `src/config/api.ts`:
- Default: `http://localhost:3000/api`
- Change if your backend runs on a different port

## 🎯 Routes

- `/login` - Login page
- `/register` - Registration page
- `/movies` - Browse movies
- `/movies/:id` - Movie details
- `/movies/:id/review` - Create review (requires login)

## 💡 Advantages Over Mobile

- ✅ No React Native bridge issues
- ✅ Faster development
- ✅ Easier debugging
- ✅ Works in any browser
- ✅ No Expo/device setup needed

Enjoy building! 🎉
