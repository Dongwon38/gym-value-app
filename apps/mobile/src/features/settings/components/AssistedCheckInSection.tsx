import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAssistedCheckIn } from '../../../app/providers/AssistedCheckInContext';
import { Card, PrimaryButton } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { SettingsRow } from './SettingsRow';
import { StatusPill } from './StatusPill';

function formatPermissionStatusLabel(status: string | null) {
  if (status === 'granted') {
    return 'Allowed';
  }

  if (status === 'denied') {
    return 'Denied';
  }

  if (status === 'blocked') {
    return 'Blocked';
  }

  return 'Unavailable';
}

function getPermissionTone(status: string | null) {
  if (status === 'granted') {
    return 'success' as const;
  }

  if (status === 'blocked') {
    return 'danger' as const;
  }

  if (status === 'denied') {
    return 'warning' as const;
  }

  return 'neutral' as const;
}

function getTrackingStatusLabel(status: ReturnType<typeof useAssistedCheckIn>['snapshot']['status']) {
  if (status === 'tracking') {
    return 'Tracking';
  }

  if (status === 'syncing') {
    return 'Refreshing';
  }

  if (status === 'error') {
    return 'Needs review';
  }

  if (status === 'manual_only') {
    return 'Manual only';
  }

  return 'Idle';
}

function getTrackingTone(status: ReturnType<typeof useAssistedCheckIn>['snapshot']['status']) {
  if (status === 'tracking') {
    return 'success' as const;
  }

  if (status === 'syncing') {
    return 'accent' as const;
  }

  if (status === 'error') {
    return 'danger' as const;
  }

  if (status === 'manual_only') {
    return 'warning' as const;
  }

  return 'neutral' as const;
}

function getStatusBody(snapshot: ReturnType<typeof useAssistedCheckIn>['snapshot']) {
  if (snapshot.status === 'tracking') {
    return 'Your primary gym is synced for assisted suggestions.';
  }

  if (snapshot.status === 'syncing') {
    return 'Permissions and geofence state are refreshing now.';
  }

  if (snapshot.status === 'error') {
    return 'Assisted suggestions hit an error. Manual visits still work.';
  }

  if (snapshot.status === 'manual_only') {
    return 'Manual tracking is active until permissions and delivery are available.';
  }

  return 'Assisted suggestions are idle until the next refresh.';
}

export function AssistedCheckInSection() {
  const theme = useAppTheme();
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);
  const { refresh, snapshot } = useAssistedCheckIn();

  return (
    <>
      <Card title="Permissions">
        <View>
          <SettingsRow
            label="Location"
            trailing={
              <StatusPill
                label={formatPermissionStatusLabel(snapshot.locationPermission)}
                tone={getPermissionTone(snapshot.locationPermission)}
              />
            }
          />
          <SettingsRow
            label="Background"
            trailing={
              <StatusPill
                label={formatPermissionStatusLabel(snapshot.backgroundLocationPermission)}
                tone={getPermissionTone(snapshot.backgroundLocationPermission)}
              />
            }
          />
          <SettingsRow
            label="Notifications"
            last
            trailing={
              <StatusPill
                label={formatPermissionStatusLabel(snapshot.notificationPermission)}
                tone={getPermissionTone(snapshot.notificationPermission)}
              />
            }
          />
        </View>
      </Card>

      <Card title="Assisted check-in">
        <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>
          {getStatusBody(snapshot)}
        </Text>

        <View style={{ marginTop: theme.spacing.md }}>
          <SettingsRow
            label="Status"
            trailing={
              <StatusPill
                label={getTrackingStatusLabel(snapshot.status)}
                tone={getTrackingTone(snapshot.status)}
              />
            }
          />
          <SettingsRow
            label="Primary gym sync"
            value={snapshot.primaryGymId ? 'Connected' : 'Not set'}
          />
          <SettingsRow
            label="Tracking"
            last
            value={snapshot.trackingEnabled ? 'Enabled' : 'Manual only'}
          />
        </View>

        {snapshot.lastError ? (
          <Text style={[styles.warning, { color: theme.colors.warning }]}>
            {snapshot.lastError}
          </Text>
        ) : null}

        <View style={styles.actionRow}>
          <PrimaryButton
            label="Refresh"
            onPress={() => {
              refresh().catch(() => {});
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setShowDiagnostics(currentValue => !currentValue);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.76 : 1 }]}>
            <Text style={[styles.inlineAction, { color: theme.colors.accent }]}>
              {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
            </Text>
          </Pressable>
        </View>

        {showDiagnostics ? (
          <View
            style={[
              styles.diagnostics,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}>
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Primary gym ID: {snapshot.primaryGymId ?? 'none'}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Active visit ID: {snapshot.activeVisitId ?? 'none'}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Last prompt ID: {snapshot.lastPromptId ?? 'none'}
            </Text>
          </View>
        ) : null}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  copy: {
    fontSize: 14,
    lineHeight: 20,
  },
  diagnostics: {
    borderWidth: 1,
    gap: 8,
    marginTop: 16,
    padding: 14,
  },
  inlineAction: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  warning: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
});
