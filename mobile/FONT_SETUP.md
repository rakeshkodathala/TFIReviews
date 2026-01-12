# Font Setup Guide for TFI Reviews

## Recommended Font: **Inter** or **Poppins**

Both are excellent choices for mobile apps with great readability and modern aesthetics.

## Installation Steps

### Option 1: Using Expo Google Fonts (Recommended - Easiest)

1. Install the package:
```bash
npx expo install expo-font @expo-google-fonts/inter
# OR for Poppins:
npx expo install expo-font @expo-google-fonts/poppins
```

2. Load the font in your App.tsx:
```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
// OR
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    // OR for Poppins:
    // Poppins_400Regular,
    // Poppins_600SemiBold,
    // Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  SplashScreen.hideAsync();

  return (
    // Your app components
  );
}
```

### Option 2: Custom Font Files

1. Download font files (.ttf or .otf) from:
   - Inter: https://rsms.me/inter/
   - Poppins: https://fonts.google.com/specimen/Poppins

2. Create a `fonts` folder in your project:
```
mobile/
  assets/
    fonts/
      Inter-Regular.ttf
      Inter-SemiBold.ttf
      Inter-Bold.ttf
```

3. Update `app.json`:
```json
{
  "expo": {
    "fonts": [
      "./assets/fonts/Inter-Regular.ttf",
      "./assets/fonts/Inter-SemiBold.ttf",
      "./assets/fonts/Inter-Bold.ttf"
    ]
  }
}
```

4. Load fonts in App.tsx:
```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  SplashScreen.hideAsync();
  // ... rest of your app
}
```

## Usage in Components

Create a typography system in your styles:

```typescript
// styles/typography.ts
export const typography = {
  // Headings
  h1: {
    fontFamily: 'Inter-Bold', // or 'Inter_700Bold' if using Google Fonts
    fontSize: 28,
    lineHeight: 34,
  },
  h2: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    lineHeight: 30,
  },
  h3: {
    fontFamily: 'Inter-SemiBold', // or 'Inter_600SemiBold'
    fontSize: 20,
    lineHeight: 26,
  },
  // Body
  body: {
    fontFamily: 'Inter-Regular', // or 'Inter_400Regular'
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  // UI Elements
  button: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
};
```

## Font Weights Available

### Inter:
- Regular (400)
- Medium (500)
- SemiBold (600)
- Bold (700)

### Poppins:
- Regular (400)
- Medium (500)
- SemiBold (600)
- Bold (700)

## Best Practices

1. **Use 2-3 font weights maximum** (Regular, SemiBold, Bold)
2. **Maintain consistent font sizes** across the app
3. **Test on different screen sizes** to ensure readability
4. **Consider line height** - typically 1.4-1.6x font size for body text
5. **Use system fonts as fallback** if custom fonts fail to load

## Example Implementation

```typescript
// In your component
<Text style={[styles.title, { fontFamily: 'Inter-Bold' }]}>
  Movie Title
</Text>

// Or create a reusable component
const Heading = ({ children, style }) => (
  <Text style={[{ fontFamily: 'Inter-Bold', fontSize: 24 }, style]}>
    {children}
  </Text>
);
```
