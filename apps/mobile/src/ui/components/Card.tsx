import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { useAppTheme } from '../theme';

type CardProps = PropsWithChildren<{
  title?: string;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
}>;

export function Card({ children, style, subtitle, title }: CardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
        },
        style,
      ]}>
      {title ? (
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
          ]}>
          {subtitle}
        </Text>
      ) : null}
      <View style={title || subtitle ? { marginTop: theme.spacing.md } : undefined}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  } satisfies TextStyle,
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
});
