# Inter Font Usage Guide

Inter font has been successfully installed and configured for your app!

## ✅ What's Been Set Up

1. **Font Installation**: Inter font (Regular, Medium, SemiBold, Bold) is installed
2. **Font Loading**: Fonts are loaded in `App.tsx` with splash screen handling
3. **Typography System**: Created `src/constants/typography.ts` with predefined styles

## 📝 How to Use Inter Font

### Option 1: Use Typography Constants (Recommended)

```typescript
import { typography } from '../constants/typography';

// In your component
<Text style={typography.styles.h1}>Movie Title</Text>
<Text style={typography.styles.body}>Review text</Text>
<Text style={typography.styles.button}>Button Text</Text>
```

### Option 2: Use Font Family Directly

```typescript
<Text style={{ fontFamily: 'Inter_400Regular' }}>Regular text</Text>
<Text style={{ fontFamily: 'Inter_600SemiBold' }}>SemiBold text</Text>
<Text style={{ fontFamily: 'Inter_700Bold' }}>Bold text</Text>
```

### Option 3: Combine with Existing Styles

```typescript
const styles = StyleSheet.create({
  title: {
    ...typography.styles.h2,
    color: '#fff',
  },
  body: {
    ...typography.styles.body,
    color: '#ccc',
  },
});
```

## 🎨 Available Font Weights

- `Inter_400Regular` - Regular weight (default body text)
- `Inter_500Medium` - Medium weight (labels, emphasis)
- `Inter_600SemiBold` - SemiBold weight (headings, buttons)
- `Inter_700Bold` - Bold weight (titles, strong emphasis)

## 📐 Predefined Styles

### Headings
- `typography.styles.h1` - Large title (28px, Bold)
- `typography.styles.h2` - Section title (24px, Bold)
- `typography.styles.h3` - Subsection (20px, SemiBold)
- `typography.styles.h4` - Small heading (18px, SemiBold)

### Body Text
- `typography.styles.body` - Default body (16px, Regular)
- `typography.styles.bodySmall` - Small body (14px, Regular)
- `typography.styles.bodyLarge` - Large body (18px, Regular)

### UI Elements
- `typography.styles.button` - Button text (16px, SemiBold)
- `typography.styles.buttonSmall` - Small button (14px, SemiBold)
- `typography.styles.caption` - Caption text (12px, Regular)
- `typography.styles.label` - Form labels (14px, Medium)

## 🔄 Migration Tips

When updating existing screens to use Inter font:

1. **Replace fontFamily in StyleSheet**:
   ```typescript
   // Before
   fontSize: 16,
   fontWeight: '600',
   
   // After
   fontFamily: 'Inter_600SemiBold',
   fontSize: 16,
   ```

2. **Remove fontWeight** when using custom fonts (fontFamily handles weight)

3. **Use typography constants** for consistency across the app

## ✨ Next Steps

The font is ready to use! You can now:
- Update existing screens to use Inter font
- Use the typography constants for new components
- Enjoy consistent, beautiful typography throughout your app
