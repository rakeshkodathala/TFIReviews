# 🚀 Play Store Beta Testing - Ready Checklist

## ✅ **CONFIGURATION STATUS**

### ✅ **READY**
- ✅ Android package name: `com.tfireviews.app`
- ✅ Version: 1.0.0
- ✅ Version code: 1
- ✅ Android permissions declared (Camera, Location, Storage, Notifications, Internet)
- ✅ Target SDK: 34
- ✅ Compile SDK: 34
- ✅ Expo plugins configured
- ✅ App icons present
- ✅ Splash screen configured
- ✅ EAS project ID configured
- ✅ Build configuration ready (`eas.json`)

---

## ⚠️ **REQUIRED BEFORE BUILDING**

### 1. **Update Production API URL** 🔴 CRITICAL
**Current**: `http://10.0.0.244:3000/api` (Local IP - won't work for testers)

**Action Required:**
1. Deploy your backend to production (Heroku, Railway, AWS, etc.)
2. Update `mobile/app.json`:
   ```json
   "extra": {
     "apiUrl": "https://your-production-backend.com/api",
     "eas": {
       "projectId": "9a633804-6eac-47be-8004-4e6cf789e091"
     }
   }
   ```

**OR** update `mobile/src/config/api.ts`:
```typescript
export const API_BASE_URL = 'https://your-production-backend.com/api';
```

### 2. **Create Privacy Policy** 🔴 CRITICAL
**Required by Google Play**

**Quick Option**: Create a simple privacy policy page:
- What data you collect (reviews, profile info, etc.)
- How you use it (to provide the service)
- Data security measures
- User rights (GDPR compliance - account deletion, data export)
- Contact information

**Host it**: GitHub Pages, your website, or any hosting service

**Add URL**: When creating Play Store listing

### 3. **Prepare Store Listing** 🔴 CRITICAL
**Required for Play Store submission**

- **Short description** (80 characters max)
  - Example: "Discover and review Telugu movies. Share your thoughts with the community."
  
- **Full description** (4000 characters max)
  - Describe features, benefits, etc.

- **Screenshots** (at least 2, recommended 4-8)
  - Take screenshots on Android device
  - Show main features: Home screen, Movie details, Reviews, Profile

- **Feature graphic** (1024x500 pixels)
  - Promotional banner for Play Store

---

## 🚀 **BUILD COMMANDS**

### Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Build for Android
```bash
cd mobile
eas build --platform android --profile preview
```

**Wait**: Build takes 15-30 minutes

### Step 4: Submit to Play Store
```bash
eas submit --platform android
```

---

## 📋 **GOOGLE PLAY CONSOLE SETUP**

### Prerequisites:
- Google Play Developer account ($25 one-time fee)
- Production backend deployed
- Privacy policy URL ready

### Steps:
1. **Create App**
   - Go to https://play.google.com/console
   - Click "Create app"
   - Fill in app details

2. **Store Listing**
   - Add app name: "TFI Reviews"
   - Add short & full description
   - Upload screenshots
   - Upload feature graphic
   - Add privacy policy URL

3. **Content Rating**
   - Complete questionnaire
   - Get rating certificate

4. **Set Up Internal Testing**
   - Go to "Testing" → "Internal testing"
   - Create new release
   - Upload AAB file (from `eas submit`)
   - Add tester email addresses
   - Release to testers

---

## ✅ **WHAT'S ALREADY FIXED**

I've already updated your `app.json` with:
- ✅ Android permissions (Camera, Location, Storage, Notifications, Internet)
- ✅ Target SDK version (34)
- ✅ Compile SDK version (34)
- ✅ Expo plugins with permission messages

---

## ⏱️ **TIMELINE**

**To Fix Critical Issues:**
- Deploy backend: 30-60 minutes
- Create privacy policy: 30 minutes
- Prepare store assets: 30-60 minutes

**Build & Submit:**
- Build time: 15-30 minutes
- Play Console setup: 30-60 minutes

**Total: ~3-4 hours**

---

## 🎯 **CURRENT STATUS**

**Configuration**: ✅ Ready
**Permissions**: ✅ Fixed
**Build Config**: ✅ Ready
**API URL**: ⚠️ Needs production URL
**Privacy Policy**: ⚠️ Needs to be created
**Store Assets**: ⚠️ Needs to be prepared

**Overall**: **80% Ready** - Just need production backend, privacy policy, and store assets!

---

## 📝 **QUICK START**

1. **Deploy backend** → Get production URL
2. **Update API URL** in `app.json` or `src/config/api.ts`
3. **Create privacy policy** → Host it → Get URL
4. **Take screenshots** → Prepare store listing
5. **Build**: `eas build --platform android --profile preview`
6. **Submit**: `eas submit --platform android`
7. **Complete Play Console** setup

**You're almost there!** 🎉
