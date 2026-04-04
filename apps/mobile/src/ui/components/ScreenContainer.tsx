import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appTheme, useAppTheme } from '../theme';

type ScreenContainerProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description?: string;
  scroll?: boolean;
}>;

export function ScreenContainer({
  eyebrow,
  title,
  description,
  children,
  scroll = false,
}: ScreenContainerProps) {
  const theme = useAppTheme();
  const content = (
    <>
      <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
        {eyebrow}
      </Text>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}
      <View style={[styles.content, { marginTop: theme.spacing.xl }]}>
        {children}
      </View>
    </>
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              backgroundColor: theme.colors.background,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.lg,
            },
          ]}>
          {content}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.lg,
            },
          ]}>
          {content}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  eyebrow: {
    ...appTheme.typography.eyebrow,
  },
  title: {
    ...appTheme.typography.title,
    marginTop: 8,
  },
  description: {
    ...appTheme.typography.body,
    marginTop: 8,
    maxWidth: 640,
  },
  content: {
    gap: 12,
  },
});
