import React from 'react';
import { Text, TextProps, TextInput, TextInputProps } from 'react-native';
import { typography } from '../constants/typography';

/**
 * Custom Text component with Inter font applied by default
 * Use this instead of React Native's Text component throughout the app
 */
export const AppText = React.forwardRef<Text, TextProps & { variant?: keyof typeof typography.styles }>(
  ({ style, variant = 'body', ...props }, ref) => {
    return (
      <Text
        ref={ref}
        style={[typography.styles[variant], style]}
        {...props}
      />
    );
  }
);

AppText.displayName = 'AppText';

/**
 * Custom TextInput component with Inter font applied by default
 * Use this instead of React Native's TextInput component throughout the app
 */
export const AppTextInput = React.forwardRef<TextInput, TextInputProps>(
  ({ style, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        style={[typography.styles.body, style]}
        {...props}
      />
    );
  }
);

AppTextInput.displayName = 'AppTextInput';

/**
 * Predefined text variants for convenience
 */
export const H1: React.FC<TextProps> = (props) => (
  <AppText variant="h1" {...props} />
);

export const H2: React.FC<TextProps> = (props) => (
  <AppText variant="h2" {...props} />
);

export const H3: React.FC<TextProps> = (props) => (
  <AppText variant="h3" {...props} />
);

export const H4: React.FC<TextProps> = (props) => (
  <AppText variant="h4" {...props} />
);

export const Body: React.FC<TextProps> = (props) => (
  <AppText variant="body" {...props} />
);

export const BodySmall: React.FC<TextProps> = (props) => (
  <AppText variant="bodySmall" {...props} />
);

export const BodyLarge: React.FC<TextProps> = (props) => (
  <AppText variant="bodyLarge" {...props} />
);

export const ButtonText: React.FC<TextProps> = (props) => (
  <AppText variant="button" {...props} />
);

export const Caption: React.FC<TextProps> = (props) => (
  <AppText variant="caption" {...props} />
);

export const Label: React.FC<TextProps> = (props) => (
  <AppText variant="label" {...props} />
);

// Default export
export default AppText;
