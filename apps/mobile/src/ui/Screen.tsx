import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { cn } from './cn';
import { Text } from './Text';

type ScreenProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  description?: string;
  headerAction?: React.ReactNode;
  scroll?: boolean;
  title: string;
};

export function Screen({
  children,
  className,
  contentClassName,
  description,
  headerAction,
  scroll = false,
  title,
}: ScreenProps) {
  const content = (
    <Animated.View
      className={cn('gap-6 px-5 pb-8 pt-5', contentClassName)}
      entering={FadeInDown.duration(220)}>
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-4">
          <Text accessibilityRole="header" variant="screenTitle">
            {title}
          </Text>
          {headerAction ? <View>{headerAction}</View> : null}
        </View>
        {description ? (
          <Text className="max-w-[320px]" tone="secondary" variant="body">
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-background', className)} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerClassName="grow"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View className="flex-1">{content}</View>
      )}
    </SafeAreaView>
  );
}
