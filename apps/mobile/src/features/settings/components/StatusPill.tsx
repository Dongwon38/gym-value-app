import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../../ui/theme';

type StatusPillTone = 'accent' | 'danger' | 'neutral' | 'success' | 'warning';

type StatusPillProps = {
  label: string;
  tone?: StatusPillTone;
};

function resolveToneColors(
  tone: StatusPillTone,
  colors: ReturnType<typeof useAppTheme>['colors'],
) {
  if (tone === 'success') {
    return {
      backgroundColor: '#E0F0E9',
      textColor: colors.accent,
    };
  }

  if (tone === 'warning') {
    return {
      backgroundColor: '#F3E6CF',
      textColor: colors.warning,
    };
  }

  if (tone === 'danger') {
    return {
      backgroundColor: '#F2DED8',
      textColor: colors.danger,
    };
  }

  if (tone === 'accent') {
    return {
      backgroundColor: colors.surfaceMuted,
      textColor: colors.accent,
    };
  }

  return {
    backgroundColor: colors.background,
    textColor: colors.textMuted,
  };
}

export function StatusPill({
  label,
  tone = 'neutral',
}: StatusPillProps) {
  const theme = useAppTheme();
  const toneColors = resolveToneColors(tone, theme.colors);

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: toneColors.backgroundColor,
          borderRadius: theme.radius.pill,
        },
      ]}>
      <Text style={[styles.label, { color: toneColors.textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
