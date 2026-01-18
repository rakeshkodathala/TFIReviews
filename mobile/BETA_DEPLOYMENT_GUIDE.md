# 🚀 TFI Reviews - Beta Deployment Guide

## ✅ **READINESS CHECK: READY FOR BETA**

Your app is ready for beta testing! Here's what you have:
- ✅ Core features working
- ✅ Good UI/UX
- ✅ Performance optimizations
- ✅ Error handling
- ✅ Offline detection

---

## 📱 **WHERE TO DEPLOY**

### **Option 1: Expo Application Services (EAS) - RECOMMENDED**
- **iOS**: TestFlight (Apple's beta testing platform)
- **Android**: Google Play Internal Testing
- **Pros**: Easy setup, handles certificates automatically, free tier available
- **Best for**: Quick beta deployment

### **Option 2: Manual Build**
- Build locally and distribute manually
- **Pros**: More control
- **Cons**: Complex certificate management

**We'll use EAS (Option 1) - it's the easiest!**

---

## 🛠️ **STEP-BY-STEP DEPLOYMENT GUIDE**

### **STEP 1: Update App Configuration**

First, let's update `app.json` with proper app details:

```json
{
  "expo": {
    "name": "TFI Reviews",
    "slug": "tfi-reviews",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a1a"
    },
    "ios": {
      "bundleIdentifier": "com.tfireviews.app",
      "supportsTablet": true,
      "buildNumber": "1"
    },
    "android": {
      "package": "com.tfireviews.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a1a"
      }
    }
  }
}
```

### **STEP 2: Install EAS CLI**

```bash
cd mobile
npm install -g eas-cli
```

### **STEP 3: Login to Expo**

```bash
eas login
```

You'll need to create an Expo account if you don't have one (free).

### **STEP 4: Configure EAS Build**

```bash
cd mobile
eas build:configure
```

This creates an `eas.json` file with build configurations.

### **STEP 5: Set Up Environment Variables**

Create a `.env` file in the `mobile` directory:

```env
# Development
API_BASE_URL=http://10.0.0.244:3000/api

# Production (update with your production backend URL)
# API_BASE_URL=https://your-backend-domain.com/api
```

**IMPORTANT**: Update `src/config/api.ts` to use environment variables:

```typescript
import Constants from 'expo-constants';

export const API_BASE_URL = 
  Constants.expoConfig?.extra?.apiUrl || 
  'http://10.0.0.244:3000/api';
```

### **STEP 6: Build for iOS (TestFlight)**

```bash
cd mobile
eas build --platform ios --profile preview
```

**What happens:**
- EAS builds your app in the cloud
- Creates an `.ipa` file
- Takes 15-30 minutes

**After build completes:**
```bash
eas submit --platform ios
```

This uploads to TestFlight automatically.

### **STEP 7: Build for Android (Play Store)**

```bash
cd mobile
eas build --platform android --profile preview
```

**What happens:**
- Creates an `.apk` or `.aab` file
- Takes 15-30 minutes

**After build completes:**
```bash
eas submit --platform android
```

This uploads to Google Play Console.

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **Before Building:**

- [ ] Update `app.json` with proper name and bundle IDs
- [ ] Set up production backend URL
- [ ] Test app on physical devices
- [ ] Verify all features work
- [ ] Check app icons and splash screens

### **For iOS TestFlight:**

- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect account
- [ ] Bundle ID configured
- [ ] Privacy policy URL (if required)

### **For Android Play Store:**

- [ ] Google Play Console account ($25 one-time)
- [ ] Package name configured
- [ ] Privacy policy URL
- [ ] App signing key (EAS handles this)

---

## 🔧 **EAS BUILD PROFILES**

Create/update `eas.json`:

```json
{
  "build": {
    "preview": {
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🌐 **BACKEND SETUP FOR BETA**

### **Option A: Use Your Current Backend (Development)**
- Keep backend running on your machine
- Use your public IP address
- **Limitation**: Backend must be running for app to work

### **Option B: Deploy Backend to Cloud (RECOMMENDED)**
- Deploy to Heroku, Railway, Render, or AWS
- Update API URL in app config
- **Better**: Backend always available

**Quick Deploy Options:**
1. **Railway** (railway.app) - Easy, free tier
2. **Render** (render.com) - Free tier available
3. **Heroku** - Paid but reliable
4. **AWS/DigitalOcean** - More control

---

## 📝 **TESTFLIGHT SETUP (iOS)**

1. **After `eas submit`:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to your app → TestFlight
   - Add internal testers (up to 100)
   - Add external testers (up to 10,000)

2. **Add Testers:**
   - Internal: Your team members
   - External: Beta testers (requires App Review)

3. **Share TestFlight Link:**
   - Testers get email invitation
   - Or share public TestFlight link

---

## 📝 **GOOGLE PLAY INTERNAL TESTING (Android)**

1. **After `eas submit`:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Navigate to your app → Testing → Internal testing
   - Upload the APK/AAB file

2. **Add Testers:**
   - Create tester list
   - Add email addresses
   - Share opt-in link

3. **Release:**
   - Create release
   - Add release notes
   - Publish to internal testing track

---

## ⚠️ **IMPORTANT NOTES**

### **API URL Configuration:**
Currently hardcoded to `http://10.0.0.244:3000/api`. For beta:
- **Option 1**: Deploy backend to cloud, update URL
- **Option 2**: Use ngrok/tunneling service for development backend
- **Option 3**: Keep local backend (testers need to be on same network)

### **Console Logs:**
50+ console.log statements found. For beta, this is OK. For production, remove them.

### **App Icons:**
Make sure you have proper app icons:
- iOS: 1024x1024 icon
- Android: Adaptive icon (foreground + background)

---

## 🚀 **QUICK START COMMANDS**

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure
cd mobile
eas build:configure

# 4. Build iOS
eas build --platform ios --profile preview

# 5. Submit iOS
eas submit --platform ios

# 6. Build Android
eas build --platform android --profile preview

# 7. Submit Android
eas submit --platform android
```

---

## 💰 **COSTS**

### **Free:**
- Expo EAS Build: Free tier (limited builds/month)
- TestFlight: Free (with Apple Developer account)
- Google Play Internal Testing: Free

### **Paid:**
- **Apple Developer**: $99/year (required for TestFlight)
- **Google Play**: $25 one-time (required for Play Store)
- **EAS Build**: Free tier available, paid plans for more builds

---

## 📞 **NEED HELP?**

- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **TestFlight Guide**: https://developer.apple.com/testflight/
- **Play Console**: https://support.google.com/googleplay/android-developer

---

## ✅ **READY TO DEPLOY?**

1. ✅ Update `app.json` with proper name
2. ✅ Set up backend (cloud or local)
3. ✅ Update API URL
4. ✅ Run `eas build:configure`
5. ✅ Build and submit!

**Your app is ready for beta testing! 🎉**
