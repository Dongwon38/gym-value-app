import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { CostsScreen } from '../../screens/costs/CostsScreen';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';
import { VisitsScreen } from '../../screens/visits/VisitsScreen';
import { appTheme } from '../../ui/theme';
import { MainTabParamList } from './navigationTypes';
import { SoftTabBar } from './SoftTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();
const renderSoftTabBar = (props: Parameters<typeof SoftTabBar>[0]) => (
  <SoftTabBar {...props} />
);

export function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={renderSoftTabBar}
      screenOptions={{
        headerShown: false,
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
