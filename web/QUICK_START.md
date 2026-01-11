# Web App - Quick Start Guide

## ✅ Setup Complete!

Your web app is ready to run. Here's how:

## 🚀 Run the App

1. **Make sure backend is running** (port 3000):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the web app** (will run on port 3001):
   ```bash
   cd web
   npm start
   ```

3. **Open in browser**:
   - Automatically opens at `http://localhost:3001`
   - Or manually navigate to that URL

## 🎯 What You'll See

1. **Login/Register page** (if not logged in)
2. **Movies page** - Browse and search Tollywood movies
3. **Movie Details** - Click any movie to see details
4. **Create Review** - Write reviews for movies (requires login)

## ✨ Features

- ✅ No React Native bridge issues!
- ✅ Fast development with hot reload
- ✅ Easy debugging with browser DevTools
- ✅ Works on any device with a browser
- ✅ Same functionality as mobile app

## 🔧 If Port 3001 is Busy

The app will automatically ask to use a different port (like 3002, 3003, etc.)
Just press `Y` when prompted.

## 📝 Notes

- Backend must be running on `http://localhost:3000`
- Web app uses `localStorage` for token storage (not AsyncStorage)
- All API calls go to `http://localhost:3000/api`

Enjoy! 🎉
