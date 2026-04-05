import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, View } from 'react-native';
import {
  CalendarDays,
  DollarSign,
  Home,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../ui';
import { appTheme } from '../../ui/theme';

const iconMap = {
  Costs: DollarSign,
  Home,
  Settings,
  Visits: CalendarDays,
} as const;

export function SoftTabBar({
  descriptors,
  navigation,
  state,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-background px-4 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View
        className="flex-row rounded-[28px] border border-border/60 bg-card px-3 py-2"
        style={appTheme.shadow.floating}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const label =
            typeof descriptor.options.tabBarLabel === 'string'
              ? descriptor.options.tabBarLabel
              : typeof descriptor.options.title === 'string'
                ? descriptor.options.title
                : route.name;
          const isFocused = state.index === index;
          const Icon = iconMap[route.name as keyof typeof iconMap];

          const onPress = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: 'tabPress',
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              target: route.key,
              type: 'tabLongPress',
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              className="flex-1 items-center justify-center gap-1 rounded-[22px] px-2 py-3 active:opacity-85"
              onLongPress={onLongPress}
              onPress={onPress}>
              <Icon
                color={
                  isFocused ? appTheme.colors.tabActive : appTheme.colors.tabInactive
                }
                size={20}
                strokeWidth={2}
              />
              <Text
                className={isFocused ? 'text-tab-active' : 'text-tab-inactive'}
                variant="tabLabel">
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
