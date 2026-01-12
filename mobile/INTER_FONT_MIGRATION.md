# Inter Font Migration Guide

This guide shows how to update all screens to use Inter font consistently.

## ✅ Already Updated
- ✅ `MoviesScreen.tsx` - Main home screen
- ✅ `App.tsx` - Font loading setup
- ✅ Typography system created

## 📝 Migration Pattern

### Step 1: Import Typography
```typescript
import { typography } from "../constants/typography";
```

### Step 2: Replace Font Styles

#### Replace `fontWeight` + `fontSize` with Typography Constants:

**Before:**
```typescript
title: {
  fontSize: 24,
  fontWeight: "700",
  color: "#fff",
}
```

**After:**
```typescript
title: {
  ...typography.styles.h2,  // or h3, h4, etc.
  color: "#fff",
}
```

#### Common Replacements:

| Old Style | New Style |
|-----------|-----------|
| `fontSize: 28, fontWeight: "700"` | `...typography.styles.h1` |
| `fontSize: 24, fontWeight: "700"` | `...typography.styles.h2` |
| `fontSize: 20, fontWeight: "700"` | `...typography.styles.h3` |
| `fontSize: 18, fontWeight: "700"` | `...typography.styles.h4` |
| `fontSize: 18, fontWeight: "600"` | `...typography.styles.h4` |
| `fontSize: 16, fontWeight: "400"` | `...typography.styles.body` |
| `fontSize: 16, fontWeight: "600"` | `...typography.styles.button` |
| `fontSize: 14, fontWeight: "400"` | `...typography.styles.bodySmall` |
| `fontSize: 14, fontWeight: "600"` | `...typography.styles.buttonSmall` |
| `fontSize: 12, fontWeight: "400"` | `...typography.styles.caption` |

#### For Custom Sizes:
```typescript
// Instead of:
fontSize: 15,
fontWeight: "600",

// Use:
fontSize: typography.fontSize.base,
fontFamily: typography.fontFamily.semiBold,
```

#### Remove `fontWeight` When Using `fontFamily`:
```typescript
// ❌ Wrong - Don't use both
fontFamily: typography.fontFamily.bold,
fontWeight: "700",  // Remove this!

// ✅ Correct
fontFamily: typography.fontFamily.bold,
```

## 🎯 Screens to Update

### High Priority (User-Facing):
1. ✅ MoviesScreen.tsx - DONE
2. ⏳ LoginScreen.tsx
3. ⏳ RegisterScreen.tsx
4. ⏳ MovieDetailsScreen.tsx
5. ⏳ CreateReviewScreen.tsx
6. ⏳ SearchScreen.tsx

### Medium Priority:
7. ⏳ AccountScreen.tsx
8. ⏳ ActivityScreen.tsx
9. ⏳ MyReviewsScreen.tsx
10. ⏳ WatchlistScreen.tsx

### Lower Priority:
11. ⏳ SettingsScreen.tsx
12. ⏳ NotificationsScreen.tsx
13. ⏳ AboutScreen.tsx
14. ⏳ CastDetailsScreen.tsx

## 🔍 Quick Find & Replace

Search for these patterns in each screen file:
- `fontWeight: "700"` → Replace with `fontFamily: typography.fontFamily.bold`
- `fontWeight: "600"` → Replace with `fontFamily: typography.fontFamily.semiBold`
- `fontWeight: "500"` → Replace with `fontFamily: typography.fontFamily.medium`
- `fontWeight: "400"` → Replace with `fontFamily: typography.fontFamily.regular` (or just use typography.styles.body)

## 📋 Checklist Template

For each screen:
- [ ] Import typography constants
- [ ] Replace all `fontWeight` + `fontSize` combinations
- [ ] Use typography.styles.* where possible
- [ ] Remove standalone `fontWeight` properties
- [ ] Test the screen to ensure fonts render correctly

## 💡 Tips

1. **Use spread operator** for typography styles: `...typography.styles.h2`
2. **Keep color and other properties** separate from typography
3. **Test on device** to ensure fonts load correctly
4. **Be consistent** - use the same typography style for similar UI elements across screens
