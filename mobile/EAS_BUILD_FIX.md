# 🔧 EAS Build Fix Guide

## Issue: `expo-modules-autolinking` incompatibility

This error occurs when there's a version mismatch between Expo packages. Here's how to fix it:

## ✅ **SOLUTION 1: Use Latest EAS CLI with npx**

Instead of using the global `eas` command, use `npx` to ensure you're using the latest version:

```bash
cd mobile
npx eas-cli@latest build --platform ios --profile preview
```

## ✅ **SOLUTION 2: Clear All Caches**

```bash
cd mobile

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
rm -rf .expo node_modules/.cache

# Clear watchman (if installed)
watchman watch-del-all 2>/dev/null || true
```

## ✅ **SOLUTION 3: Update Expo SDK (if needed)**

If the issue persists, you might need to update Expo:

```bash
cd mobile
npx expo install expo@latest
npx expo install --fix
```

## ✅ **SOLUTION 4: Use EAS Build with Clean Build**

Try building with the `--clear-cache` flag:

```bash
npx eas-cli@latest build --platform ios --profile preview --clear-cache
```

## ✅ **SOLUTION 5: Check for Conflicting Packages**

Make sure you don't have conflicting versions:

```bash
cd mobile
npm list expo-modules-autolinking
npm list @expo/prebuild-config
```

## 🚀 **RECOMMENDED: Try Build Again**

After applying the fixes above, try building again:

```bash
cd mobile

# For iOS (INTERACTIVE MODE - removes --non-interactive flag)
npx eas-cli@latest build --platform ios --profile preview

# For Android  
npx eas-cli@latest build --platform android --profile preview
```

**IMPORTANT**: Run these commands **interactively** (without `--non-interactive`) so EAS can set up credentials for you.

## 📝 **What We've Already Fixed**

✅ Updated `expo-image-picker` to ~17.0.10
✅ Updated `expo-location` to ~19.0.8
✅ Cleared Expo cache
✅ Updated `eas.json` configuration
✅ Ran `expo-doctor` (all checks passed)

## ⚠️ **If Still Failing**

If the build still fails, try:

1. **Check Expo SDK compatibility:**
   ```bash
   npx expo-doctor
   ```

2. **Try a development build first:**
   ```bash
   npx eas-cli@latest build --platform ios --profile development
   ```

3. **Check EAS Build logs** for more specific error messages

4. **Contact Expo Support** if the issue persists - they can help with SDK-specific issues

## 💡 **Alternative: Use Expo Go for Beta Testing**

If EAS Build continues to have issues, you can use Expo Go for initial beta testing:

```bash
cd mobile
npx expo start
```

Then share the QR code with testers. However, this has limitations (no custom native code, requires Expo Go app).
