# Typography Components Guide

## 🎯 Solution: Custom Text Components

Instead of updating each screen individually, we've created custom Text components that automatically use Inter font. This means **all screens will use Inter font automatically** when you use these components.

## 📦 Components Available

### Main Component
- **`AppText`** - Main text component with Inter font (replaces `Text`)
- **`AppTextInput`** - Text input with Inter font (replaces `TextInput`)

### Predefined Variants (for convenience)
- **`H1`**, **`H2`**, **`H3`**, **`H4`** - Headings
- **`Body`**, **`BodySmall`**, **`BodyLarge`** - Body text
- **`ButtonText`** - Button text
- **`Caption`** - Small captions
- **`Label`** - Form labels

## 🚀 How to Use

### Option 1: Replace Text with AppText (Recommended)

**Before:**
```typescript
import { Text } from 'react-native';

<Text style={styles.title}>Hello</Text>
```

**After:**
```typescript
import { AppText } from '../components/Typography';

<AppText style={styles.title}>Hello</AppText>
```

### Option 2: Use Predefined Variants

```typescript
import { H1, Body, ButtonText } from '../components/Typography';

<H1>Movie Title</H1>
<Body>Review text here</Body>
<ButtonText>Submit</ButtonText>
```

### Option 3: Use with Variant Prop

```typescript
import { AppText } from '../components/Typography';

<AppText variant="h2">Section Title</AppText>
<AppText variant="bodySmall">Small text</AppText>
```

## 📝 Migration Steps

### For Each Screen:

1. **Import the component:**
```typescript
import { AppText, AppTextInput } from '../components/Typography';
// OR
import { H1, Body, ButtonText } from '../components/Typography';
```

2. **Replace Text with AppText:**
```typescript
// Find and replace:
<Text → <AppText
Text → AppText
```

3. **Replace TextInput with AppTextInput:**
```typescript
// Find and replace:
<TextInput → <AppTextInput
TextInput → AppTextInput
```

4. **Remove fontFamily from styles** (since it's handled by the component):
```typescript
// Before:
title: {
  fontFamily: 'Inter_700Bold',
  fontSize: 24,
}

// After (fontFamily is automatic):
title: {
  fontSize: 24,  // Optional, can use variant prop instead
}
```

## ✅ Benefits

1. **Automatic Inter font** - All text uses Inter by default
2. **Consistent typography** - Same font across all screens
3. **Easy to maintain** - Change font in one place (Typography.tsx)
4. **Type-safe** - TypeScript support
5. **Flexible** - Can still override styles when needed

## 🎨 Examples

### Example 1: Simple Replacement
```typescript
// Before
<Text style={styles.title}>Welcome</Text>

// After
<AppText style={styles.title}>Welcome</AppText>
```

### Example 2: Using Variants
```typescript
// Before
<Text style={{ fontSize: 24, fontWeight: '700' }}>Movie Title</Text>

// After
<H2>Movie Title</H2>
```

### Example 3: With Custom Styles
```typescript
// Before
<Text style={[styles.title, { color: '#007AFF' }]}>Hello</Text>

// After
<AppText variant="h2" style={{ color: '#007AFF' }}>Hello</AppText>
```

## 🔄 Quick Migration Script

You can use find & replace in your editor:

1. Find: `import { Text } from 'react-native';`
   Replace: `import { AppText } from '../components/Typography';`

2. Find: `<Text`
   Replace: `<AppText`

3. Find: `</Text>`
   Replace: `</AppText>`

4. Find: `import { TextInput } from 'react-native';`
   Replace: `import { AppTextInput } from '../components/Typography';`

5. Find: `<TextInput`
   Replace: `<AppTextInput`

## ⚠️ Important Notes

- **You can still use regular Text** - But it won't have Inter font
- **Styles still work** - You can override fontFamily if needed
- **Performance** - No performance impact, just a wrapper component
- **Backward compatible** - Existing code still works, just replace gradually

## 🎯 Next Steps

1. Start using `AppText` and `AppTextInput` in new code
2. Gradually replace existing `Text` components
3. Remove `fontFamily` from StyleSheet definitions (optional cleanup)
