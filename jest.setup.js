// Jest setup file for global test configuration

// Mock React Native modules that aren't available in Node.js environment
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      select: jest.fn(obj => obj.ios || obj.default),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
    StatusBar: {
      currentHeight: 44,
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3000',
      },
    },
  },
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Mock performance API for performance monitoring tests
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Mock __DEV__ global for React Native
global.__DEV__ = true;
