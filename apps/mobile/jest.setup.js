jest.mock('react-native-reanimated');

jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    getCurrentPosition: jest.fn((success, _error, _options) => {
      success({
        coords: {
          accuracy: 42,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: 49.2827,
          longitude: -123.1207,
          speed: null,
        },
        timestamp: Date.now(),
      });
    }),
  },
}));

jest.mock('react-native-permissions', () => {
  const RESULTS = {
    BLOCKED: 'blocked',
    DENIED: 'denied',
    GRANTED: 'granted',
    LIMITED: 'limited',
    UNAVAILABLE: 'unavailable',
  };

  const notificationResponse = { settings: {}, status: RESULTS.GRANTED };

  return {
    PERMISSIONS: {
      ANDROID: {
        ACCESS_BACKGROUND_LOCATION: 'android.permission.ACCESS_BACKGROUND_LOCATION',
        ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      },
      IOS: {
        LOCATION_ALWAYS: 'ios.permission.LOCATION_ALWAYS',
        LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
      },
    },
    RESULTS,
    check: jest.fn(async () => RESULTS.GRANTED),
    checkNotifications: jest.fn(async () => notificationResponse),
    request: jest.fn(async () => RESULTS.GRANTED),
    requestNotifications: jest.fn(async () => notificationResponse),
  };
});

const { NativeModules } = require('react-native');

Object.assign(NativeModules, {
  GymAssistedNotifications: {
    addListener: jest.fn(),
    cancelByTag: jest.fn().mockResolvedValue(undefined),
    removeListeners: jest.fn(),
    showCheckInSuggestion: jest.fn().mockResolvedValue(undefined),
    showCheckOutSuggestion: jest.fn().mockResolvedValue(undefined),
  },
  GymGeofence: {
    addListener: jest.fn(),
    addRegion: jest.fn().mockResolvedValue(undefined),
    removeListeners: jest.fn(),
    removeRegion: jest.fn().mockResolvedValue(undefined),
  },
});
