import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';

import { appTheme } from '../ui/theme';
import { RootNavigator } from './navigation/RootNavigator';

enableScreens();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: appTheme.colors.background,
    card: appTheme.colors.surface,
    primary: appTheme.colors.accent,
    text: appTheme.colors.textPrimary,
    border: appTheme.colors.border,
  },
};

export function AppShell() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}
