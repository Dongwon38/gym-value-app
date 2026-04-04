import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../../ui/theme';

type SettingsRowProps = {
  detail?: string;
  label: string;
  last?: boolean;
  onPress?: () => void;
  trailing?: React.ReactNode;
  value?: string;
};

export function SettingsRow({
  detail,
  label,
  last = false,
  onPress,
  trailing,
  value,
}: SettingsRowProps) {
  const theme = useAppTheme();
  const content = (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: theme.colors.border,
        },
        last ? styles.rowLast : styles.rowWithDivider,
      ]}>
      <View style={styles.textBlock}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
          {label}
        </Text>
        {detail ? (
          <Text style={[styles.detail, { color: theme.colors.textMuted }]}>
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing ?? (
        <Text
          numberOfLines={1}
          style={[styles.value, { color: theme.colors.textSecondary }]}>
          {value ?? '-'}
        </Text>
      )}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  detail: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 10,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowWithDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'right',
  },
});
