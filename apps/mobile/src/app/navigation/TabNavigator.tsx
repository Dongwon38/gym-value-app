import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { CostsScreen } from '../../screens/costs/CostsScreen';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';
import { VisitsScreen } from '../../screens/visits/VisitsScreen';
import { appTheme } from '../../ui/theme';
import { MainTabParamList } from './navigationTypes';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: appTheme.colors.surface,
        },
        headerTitleStyle: {
          color: appTheme.colors.textPrimary,
          fontSize: 18,
          fontWeight: '600',
        },
        tabBarActiveTintColor: appTheme.colors.accent,
        tabBarInactiveTintColor: '#776B5B',
        tabBarStyle: {
          backgroundColor: appTheme.colors.surface,
          borderTopColor: appTheme.colors.border,
        },
        sceneStyle: {
          backgroundColor: appTheme.colors.background,
        },
      }}>
      <Tab.Screen component={HomeScreen} name="Home" />
      <Tab.Screen component={VisitsScreen} name="Visits" />
      <Tab.Screen component={CostsScreen} name="Costs" />
      <Tab.Screen component={SettingsScreen} name="Settings" />
    </Tab.Navigator>
  );
}
