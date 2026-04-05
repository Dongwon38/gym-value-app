import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { cn } from './cn';
import { Text } from './Text';

type BottomSheetFormShellProps = {
  children: React.ReactNode;
  childrenClassName?: string;
  footer?: React.ReactNode;
  onClose: () => void;
  subtitle?: string;
  title?: string;
  visible: boolean;
};

export function BottomSheetFormShell({
  children,
  childrenClassName,
  footer,
  onClose,
  subtitle,
  title,
  visible,
}: BottomSheetFormShellProps) {
  const insets = useSafeAreaInsets();
  const [shouldRender, setShouldRender] = React.useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      progress.value = withTiming(1, { duration: 220 });
      return;
    }

    progress.value = withTiming(0, { duration: 180 }, finished => {
      if (finished) {
        runOnJS(setShouldRender)(false);
      }
    });
  }, [progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: 0.9 + progress.value * 0.1,
    transform: [
      {
        translateY: (1 - progress.value) * 36,
      },
    ],
  }));

  if (!shouldRender) {
    return null;
  }

  return (
    <Modal onRequestClose={onClose} transparent visible>
      <View className="flex-1 justify-end bg-transparent">
        <Animated.View className="absolute inset-0 bg-overlay" style={backdropStyle} />
        <Pressable className="absolute inset-0" onPress={onClose} />
        <SafeAreaView className="justify-end" edges={['bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={insets.bottom}>
            <Animated.View
              className="rounded-t-[28px] border-t border-border/70 bg-card px-5 pt-3"
              style={sheetStyle}>
              <View className="mb-4 items-center">
                <View className="h-1.5 w-12 rounded-full bg-border" />
              </View>
              {title ? (
                <View className="gap-1">
                  <Text variant="listTitle">{title}</Text>
                  {subtitle ? (
                    <Text tone="secondary" variant="bodyMuted">
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <ScrollView
                className="mt-5 max-h-[520px]"
                contentContainerClassName={cn('gap-4 pb-5', childrenClassName)}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
              {footer ? (
                <View className="border-t border-border/70 pb-3 pt-3">{footer}</View>
              ) : null}
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
