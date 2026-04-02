import React, { PropsWithChildren, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bootstrapDatabase } from '../../data/db';
import { ThemeProvider, appTheme } from '../../ui/theme';
import {
  DatabaseBootstrapBoundary,
  type DatabaseBootstrapStatus,
} from './DatabaseBootstrapBoundary';

export function AppProviders({ children }: PropsWithChildren) {
  const [databaseBootstrapAttempt, setDatabaseBootstrapAttempt] = useState(0);
  const [databaseStatus, setDatabaseStatus] =
    useState<DatabaseBootstrapStatus>({
      kind: 'booting',
    });

  useEffect(() => {
    let isMounted = true;

    setDatabaseStatus({ kind: 'booting' });

    bootstrapDatabase()
      .then(() => {
        if (!isMounted) {
          return;
        }

        console.info('[app] Database readiness set to ready.');
        setDatabaseStatus({ kind: 'ready' });
      })
      .catch(error => {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unknown database bootstrap error.';

        console.error('[app] Database readiness set to error.', error);
        setDatabaseStatus({
          kind: 'error',
          message,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [databaseBootstrapAttempt]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar
          backgroundColor={appTheme.colors.background}
          barStyle="dark-content"
        />
        <DatabaseBootstrapBoundary
          onRetry={() => {
            setDatabaseBootstrapAttempt(currentAttempt => currentAttempt + 1);
          }}
          status={databaseStatus}>
          {children}
        </DatabaseBootstrapBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
