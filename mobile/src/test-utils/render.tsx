import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

// Import AuthProvider dynamically to handle mocks
let AuthProvider: React.ComponentType<{ children: React.ReactNode }>;

try {
  const authContextModule = require('../context/AuthContext');
  AuthProvider = authContextModule.AuthProvider || authContextModule.default;
} catch (e) {
  // Fallback if AuthProvider can't be imported (shouldn't happen in tests)
  AuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
}

/**
 * Custom render function that wraps components with providers.
 * 
 * Note: React Native 0.81.5 bundles react-native-renderer 19.1.0 while React is 19.2.3.
 * This causes a version mismatch warning in some tests, but doesn't affect functionality.
 * The warning is suppressed in jest.setup.js, and tests will still run correctly.
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (AuthProvider && typeof AuthProvider === 'function') {
      return <AuthProvider>{children}</AuthProvider>;
    }
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything from @testing-library/react-native
export * from '@testing-library/react-native';
