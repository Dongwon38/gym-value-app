import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appTheme, useAppTheme } from '../theme';

type ScreenContainerProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  scroll?: boolean;
  showEyebrow?: boolean;
}>;

export function ScreenContainer({
  eyebrow,
  title,
  description,
  headerAction,
  children,
  scroll = false,
  showEyebrow = true,
}: ScreenContainerProps) {
  const theme = useAppTheme();
  const content = (
    <>
      {showEyebrow ? (
        <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
          {eyebrow}
        </Text>
      ) : null}
      <View style={styles.titleRow}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
        {headerAction ? <View style={styles.headerAction}>{headerAction}</View> : null}
      </View>
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
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  headerAction: {
    alignItems: 'flex-end',
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
