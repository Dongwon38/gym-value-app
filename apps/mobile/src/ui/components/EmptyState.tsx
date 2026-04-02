import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme';
import { PrimaryButton } from './PrimaryButton';

type EmptyStateProps = {
  actionLabel?: string;
  body: string;
  onActionPress?: () => void;
  title: string;
};

export function EmptyState({
  actionLabel,
  body,
  onActionPress,
  title,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.xl,
        },
      ]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
      <Text
        style={[
          styles.body,
          { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
        ]}>
        {body}
      </Text>
      {actionLabel ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onActionPress}
          style={{ marginTop: theme.spacing.lg }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});
