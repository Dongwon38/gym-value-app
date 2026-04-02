/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

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

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  expect(renderer!.toJSON()).toBeTruthy();
  expect(renderer!.root).toBeTruthy();
  expect(JSON.stringify(renderer!.toJSON())).toContain('Home');
  expect(JSON.stringify(renderer!.toJSON())).toContain('Visits');
  expect(JSON.stringify(renderer!.toJSON())).toContain('Costs');
  expect(JSON.stringify(renderer!.toJSON())).toContain('Settings');
});
