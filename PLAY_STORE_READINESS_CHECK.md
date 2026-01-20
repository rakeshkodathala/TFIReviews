# 📱 Play Store Beta Testing Readiness Check

**Date:** $(date)
**App:** TFI Reviews
**Version:** 1.0.0

---

## ✅ **READY ITEMS**

### Configuration
- ✅ App name: "TFI Reviews"
- ✅ Package name: `com.tfireviews.app`
- ✅ Version: 1.0.0
- ✅ Version code: 1
- ✅ EAS project ID configured
- ✅ App icons present (`icon.png`, `adaptive-icon.png`)
- ✅ Splash screen configured
- ✅ Build configuration (`eas.json`) set up

### Features
- ✅ Core functionality working
- ✅ Authentication system
- ✅ Movie browsing and reviews
- ✅ Watchlist
- ✅ User profiles
- ✅ Comments and likes
- ✅ Notifications system
- ✅ Settings persistence

---

## ⚠️ **MISSING/NEEDS ATTENTION**

### 🔴 **CRITICAL - Must Fix Before Beta**

1. **Android Permissions Not Declared**
   - **Issue**: App uses camera, location, notifications but permissions not declared in `app.json`
   - **Impact**: App may crash or features won't work
   - **Fix**: Add `android.permissions` to `app.json`

2. **Production API URL**
   - **Issue**: Currently using local IP `http://10.0.0.244:3000/api`
   - **Impact**: App won't work for beta testers
   - **Fix**: Update to production backend URL

3. **Privacy Policy URL**
   - **Issue**: Google Play requires privacy policy URL
   - **Impact**: Cannot submit to Play Store without it
   - **Fix**: Create privacy policy page and add URL to `app.json`

4. **App Description & Screenshots**
   - **Issue**: Need app description and screenshots for Play Store listing
   - **Impact**: Cannot create Play Store listing
   - **Fix**: Prepare marketing materials

### 🟡 **IMPORTANT - Should Fix**

5. **Android Permissions Plugin**
   - **Issue**: Need to add `expo-permissions` or use Expo SDK permissions
   - **Impact**: Permissions may not work correctly
   - **Fix**: Ensure permissions are properly configured

6. **App Signing**
   - **Issue**: Need to set up app signing key
   - **Impact**: Cannot upload to Play Store
   - **Fix**: EAS handles this automatically, but verify

7. **Content Rating**
   - **Issue**: Need to complete content rating questionnaire
   - **Impact**: Cannot publish
   - **Fix**: Complete in Play Console

8. **Target API Level**
   - **Issue**: Need to specify target SDK version
   - **Impact**: May not work on newer Android versions
   - **Fix**: Add to `app.json`

### 🟢 **NICE TO HAVE**

9. **Store Listing Assets**
   - Feature graphic
   - Screenshots (phone and tablet)
   - Promo video (optional)

10. **App Categories**
    - Select appropriate categories in Play Console

---

## 🔧 **REQUIRED FIXES**

### Fix 1: Add Android Permissions

Update `mobile/app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.tfireviews.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "POST_NOTIFICATIONS",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a1a"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    }
  }
}
```

### Fix 2: Update API URL for Production

Update `mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-production-backend.com/api",
      "eas": {
        "projectId": "9a633804-6eac-47be-8004-4e6cf789e091"
      }
    }
  }
}
```

### Fix 3: Add Privacy Policy URL

Update `mobile/app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.tfireviews.app",
      "versionCode": 1,
      "privacy": "public",
      "permissions": [...]
    },
    "privacy": {
      "policy": "https://your-domain.com/privacy-policy"
    }
  }
}
```

### Fix 4: Add Target SDK Version

Update `mobile/app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.tfireviews.app",
      "versionCode": 1,
      "targetSdkVersion": 34,
      "compileSdkVersion": 34,
      "permissions": [...]
    }
  }
}
```

---

## 📋 **PRE-BUILD CHECKLIST**

Before running `eas build`, ensure:

- [ ] Android permissions added to `app.json`
- [ ] Production API URL configured
- [ ] Privacy policy URL added
- [ ] Target SDK version specified
- [ ] App icons are correct size (1024x1024 for icon, 1024x1024 for adaptive-icon)
- [ ] Splash screen looks good
- [ ] Test app on physical Android device
- [ ] All features work correctly
- [ ] No console errors

---

## 🚀 **BUILD COMMANDS**

### For Android Beta (Internal Testing):

```bash
cd mobile
eas build --platform android --profile preview
```

### After Build Completes:

```bash
eas submit --platform android
```

---

## 📝 **GOOGLE PLAY CONSOLE SETUP**

### Required Steps:

1. **Create Google Play Developer Account**
   - Cost: $25 one-time fee
   - URL: https://play.google.com/console

2. **Create App Listing**
   - App name: TFI Reviews
   - Default language: English
   - App type: App
   - Free or paid: Free

3. **Set Up Store Listing**
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (at least 2)
   - Feature graphic (1024x500)
   - Privacy policy URL

4. **Content Rating**
   - Complete questionnaire
   - Get rating certificate

5. **Set Up Internal Testing Track**
   - Create internal testing release
   - Upload AAB file
   - Add testers (email addresses)

---

## ⚠️ **CURRENT BLOCKERS**

1. ❌ **Android permissions not declared** - App will crash
2. ❌ **Local API URL** - Won't work for testers
3. ❌ **No privacy policy** - Cannot submit to Play Store

**Fix these 3 items before building!**

---

## ✅ **READY TO BUILD AFTER FIXES**

Once you fix the 3 critical items above, you can:

1. Run `eas build --platform android --profile preview`
2. Wait for build to complete (~15-30 minutes)
3. Run `eas submit --platform android`
4. Complete Play Console setup
5. Add testers and release!

---

**Estimated Time to Fix:** 30-60 minutes
**Estimated Time to Build:** 15-30 minutes
**Total Time to Beta:** ~2 hours (including Play Console setup)
