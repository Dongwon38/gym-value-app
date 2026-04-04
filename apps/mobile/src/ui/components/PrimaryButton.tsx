import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '../theme';

type PrimaryButtonProps = {
  disabled?: boolean;
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
};

export function PrimaryButton({
  disabled = false,
  label,
  onPress,
  style,
}: PrimaryButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled
            ? theme.colors.surfaceMuted
            : pressed
              ? theme.colors.accentPressed
              : theme.colors.accent,
          borderRadius: theme.radius.pill,
          opacity: disabled ? 0.65 : 1,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm + 2,
        },
        style,
      ]}>
      <Text style={[styles.label, { color: theme.colors.accentContrast }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
});
