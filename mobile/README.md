# TFI Reviews Mobile App

A React Native mobile app for reviewing Tollywood movies.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open on your device:
   - **iPhone**: Scan QR code with Expo Go app
   - **Android**: Scan QR code with Expo Go app
   - **iOS Simulator**: Press `i`
   - **Android Emulator**: Press `a`

## API Configuration

The app is configured to connect to your backend at `http://10.0.0.244:3000/api` (for iPhone testing).

To change the API URL, edit `src/config/api.ts`:
- **iOS Simulator**: `http://localhost:3000/api`
- **Android Emulator**: `http://10.0.2.2:3000/api`
- **Physical Device**: `http://YOUR_IP:3000/api`

## Features

- User authentication (Login/Register)
- Browse and search movies
- View movie details
- Create and view reviews
- Tollywood movie focus

## Project Structure

```
src/
  ├── config/       # API configuration
  ├── context/      # React Context (Auth)
  ├── navigation/   # Navigation setup
  ├── screens/      # Screen components
  └── services/     # API services
```

## Notes

- All boolean values are primitive booleans (not Boolean objects)
- API URL is configured for iPhone testing
- Make sure backend is running on port 3000
