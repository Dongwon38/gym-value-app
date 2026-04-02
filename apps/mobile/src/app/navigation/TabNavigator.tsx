import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { CostsScreen } from '../../screens/costs/CostsScreen';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';
import { VisitsScreen } from '../../screens/visits/VisitsScreen';
import { MainTabParamList } from './navigationTypes';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#FFFCF5',
        },
        headerTitleStyle: {
          color: '#1F1A14',
          fontSize: 18,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#2F6A5E',
        tabBarInactiveTintColor: '#776B5B',
        tabBarStyle: {
          backgroundColor: '#FFFCF5',
          borderTopColor: '#D9D0C2',
        },
        sceneStyle: {
          backgroundColor: '#F4F1EA',
        },
      }}>
      <Tab.Screen component={HomeScreen} name="Home" />
      <Tab.Screen component={VisitsScreen} name="Visits" />
      <Tab.Screen component={CostsScreen} name="Costs" />
      <Tab.Screen component={SettingsScreen} name="Settings" />
    </Tab.Navigator>
  );
}
