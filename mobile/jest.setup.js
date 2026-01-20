// Mock react-native-gesture-handler if available
try {
  require('react-native-gesture-handler/jestSetup');
} catch (e) {
  // Gesture handler not installed, skip
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()), // Return unsubscribe function
}));

// Mock Expo modules
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('react-native-youtube-iframe', () => ({
  __esModule: true,
  default: function YouTubeIframe() {
    return null;
  },
}));

// Standardized navigation mocks (global)
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const React = require('react');
  return {
    ...actual,
    useNavigation: jest.fn(() => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      reset: jest.fn(),
      canGoBack: jest.fn(() => true),
    })),
    useFocusEffect: jest.fn((callback) => {
      // Use React.useEffect to call callback after render, avoiding infinite loops
      const React = require('react');
      React.useEffect(() => {
        if (typeof callback === 'function') {
          const cleanup = callback();
          return typeof cleanup === 'function' ? cleanup : undefined;
        }
      }, []);
      return () => {};
    }),
  };
});

// Mock SafeAreaInsets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
  SafeAreaProvider: ({ children }: any) => children,
}));

// Silence console warnings
// Note: React version mismatch warnings (React 19.2.3 vs react-native-renderer 19.1.0)
// are suppressed here. This is a known compatibility issue with React Native 0.81.5
// that doesn't affect test functionality.
const originalError = console.error;
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn((...args) => {
    // Suppress React version mismatch warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Incompatible React versions')
    ) {
      return;
    }
    originalError.call(console, ...args);
  }),
};
