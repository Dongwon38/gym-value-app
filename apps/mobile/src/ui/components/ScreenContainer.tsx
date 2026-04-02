import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appTheme, useAppTheme } from '../theme';

type ScreenContainerProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
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
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>
      <View style={[styles.content, { marginTop: theme.spacing.xl }]}>
        {children}
      </View>
    </>
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              backgroundColor: theme.colors.background,
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.xl + theme.spacing.xs,
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
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.xl + theme.spacing.xs,
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
    marginTop: 10,
  },
  description: {
    ...appTheme.typography.body,
    marginTop: 12,
    maxWidth: 640,
  },
  content: {
    gap: 16,
  },
});
