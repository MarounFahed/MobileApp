/* eslint-disable */
require('@testing-library/jest-native/extend-expect');

// Reanimated mock for tests.
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// Silence noisy native warnings.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Warning: 'warning' },
}));
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));
jest.mock('expo-av', () => ({
  Audio: {
    Sound: { createAsync: jest.fn(() => Promise.resolve({ sound: {} })) },
  },
}));
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getFirstSync: jest.fn(() => null),
    getAllSync: jest.fn(() => []),
  })),
}));
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));
