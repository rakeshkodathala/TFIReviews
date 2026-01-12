/**
 * Typography system using Inter font
 * Use these constants throughout the app for consistent typography
 */

export const typography = {
  // Font families
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },

  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Predefined text styles
  styles: {
    // Headings
    h1: {
      fontFamily: 'Inter_700Bold',
      fontSize: 28,
      lineHeight: 34,
    },
    h2: {
      fontFamily: 'Inter_700Bold',
      fontSize: 24,
      lineHeight: 30,
    },
    h3: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 20,
      lineHeight: 26,
    },
    h4: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
      lineHeight: 24,
    },

    // Body text
    body: {
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      lineHeight: 24,
    },
    bodySmall: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      lineHeight: 20,
    },
    bodyLarge: {
      fontFamily: 'Inter_400Regular',
      fontSize: 18,
      lineHeight: 26,
    },

    // UI Elements
    button: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      lineHeight: 24,
    },
    buttonSmall: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      lineHeight: 20,
    },
    caption: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      lineHeight: 16,
    },
    label: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      lineHeight: 20,
    },
  },
};

// Default export for compatibility
export default typography;
