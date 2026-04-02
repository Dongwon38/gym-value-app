import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';

import { RootNavigator } from './navigation/RootNavigator';

enableScreens();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F4F1EA',
    card: '#FFFCF5',
    primary: '#2F6A5E',
    text: '#1F1A14',
    border: '#D9D0C2',
  },
};

export function AppShell() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}
