/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/data/db', () => ({
  bootstrapDatabase: jest.fn().mockResolvedValue(undefined),
  closeAppDatabase: jest.fn(),
  defaultAppSettingsId: 'default',
  defaultAppSettingsSeed: {
    checkinSuggestionsEnabled: 1,
    checkoutSuggestionsEnabled: 1,
    currency: 'CAD',
    defaultGstRate: 0.05,
    defaultPstRate: 0.07,
    homePrimaryMetric: 'cost_per_visit',
    locale: 'en-CA',
    regionPreset: 'BC_CA',
  },
  ensureDefaultAppSettings: jest.fn(),
  getDatabase: jest.fn(() => ({
    executeAsync: jest.fn().mockResolvedValue({
      rows: {
        _array: [],
        item: () => undefined,
        length: 0,
      },
    }),
  })),
  getDatabaseConfig: jest.fn(() => ({ name: 'gym-value.sqlite' })),
  hasDatabaseConnection: jest.fn(() => false),
  openAppDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    useSafeAreaInsets: () => ({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }),
    initialWindowMetrics: null,
  };
});

jest.mock('@react-navigation/native', () => ({
  DefaultTheme: {
    colors: {
      background: '#ffffff',
      card: '#ffffff',
      primary: '#000000',
      text: '#000000',
      border: '#000000',
    },
  },
  NavigationContainer: ({ children }: { children: React.ReactNode }) =>
    children,
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => {
    const mockReact = require('react');
    const { Text, View } = require('react-native');

    const Navigator = ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    );
    const Screen = ({
      component: Component,
      name,
    }: {
      component: React.ComponentType;
      name: string;
    }) =>
      mockReact.createElement(
        View,
        null,
        mockReact.createElement(Text, null, name),
        mockReact.createElement(Component),
      );

    return { Navigator, Screen };
  },
}));

beforeEach(() => {
  const { bootstrapDatabase } = jest.requireMock('../src/data/db') as {
    bootstrapDatabase: jest.Mock;
  };

  bootstrapDatabase.mockReset();
  bootstrapDatabase.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function getBootstrapDatabaseMock() {
  const { bootstrapDatabase } = jest.requireMock('../src/data/db') as {
    bootstrapDatabase: jest.Mock;
  };

  return bootstrapDatabase;
}

test('renders correctly', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});

  const bootstrapDatabase = getBootstrapDatabaseMock();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  expect(renderer!.toJSON()).toBeTruthy();
  expect(renderer!.root).toBeTruthy();
  expect(bootstrapDatabase).toHaveBeenCalled();
  expect(JSON.stringify(renderer!.toJSON())).toContain('Home');
  expect(JSON.stringify(renderer!.toJSON())).toContain('Visits');
  expect(JSON.stringify(renderer!.toJSON())).toContain('Costs');
  expect(JSON.stringify(renderer!.toJSON())).toContain('Settings');
});

test('shows a database bootstrap loading gate while setup is in flight', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  const bootstrapDatabase = getBootstrapDatabaseMock();

  bootstrapDatabase.mockImplementation(() => new Promise(() => {}));

  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  expect(JSON.stringify(renderer!.toJSON())).toContain(
    'Preparing your local gym data',
  );
  expect(JSON.stringify(renderer!.toJSON())).not.toContain('Home');
});

test('shows a retry state when database bootstrap fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  const bootstrapDatabase = getBootstrapDatabaseMock();

  bootstrapDatabase.mockRejectedValueOnce(new Error('bootstrap failed'));

  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(JSON.stringify(renderer!.toJSON())).toContain(
    'Database setup needs attention',
  );
  expect(JSON.stringify(renderer!.toJSON())).toContain('Retry Database Setup');
});
