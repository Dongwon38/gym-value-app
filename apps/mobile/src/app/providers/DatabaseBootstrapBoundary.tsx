import React, { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { Card, PrimaryButton, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

export type DatabaseBootstrapStatus =
  | {
      kind: 'booting';
    }
  | {
      kind: 'error';
      message: string;
    }
  | {
      kind: 'ready';
    };

type DatabaseBootstrapBoundaryProps = PropsWithChildren<{
  onRetry: () => void;
  status: DatabaseBootstrapStatus;
}>;

export function DatabaseBootstrapBoundary({
  children,
  onRetry,
  status,
}: DatabaseBootstrapBoundaryProps) {
  const theme = useAppTheme();

  if (status.kind === 'ready') {
    return <>{children}</>;
  }

  if (status.kind === 'error') {
    return (
      <ScreenContainer
        description="The app could not finish its local database setup. Retry the bootstrap flow before continuing."
        eyebrow="Setup"
        title="Database setup needs attention">
        <Card
          subtitle="The app is still in foundation mode, so any DB bootstrap failure is treated as a blocking error."
          title="Retry local database bootstrap">
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {status.message}
          </Text>
          <PrimaryButton
            label="Retry Database Setup"
            onPress={onRetry}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      description="Opening SQLite, running migrations, and seeding default app settings."
      eyebrow="Setup"
      title="Preparing your local gym data">
      <Card
        subtitle="This gate will disappear automatically once the local DB is ready for reads and writes."
        title="Database bootstrap in progress">
        <ActivityIndicator color={theme.colors.accent} size="small" />
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.lg,
            },
          ]}>
          The app is creating the local schema and loading BC/Canada defaults.
        </Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
});
