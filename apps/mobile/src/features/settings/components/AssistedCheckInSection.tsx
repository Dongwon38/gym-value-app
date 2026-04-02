import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAssistedCheckIn } from '../../../app/providers/AssistedCheckInContext';
import { Card, PrimaryButton } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';

function formatPermissionStatusLabel(status: string | null) {
  if (status === 'granted') {
    return 'granted';
  }

  if (status === 'denied') {
    return 'denied';
  }

  if (status === 'blocked') {
    return 'blocked';
  }

  return 'unavailable';
}

function getStatusTitle(status: ReturnType<typeof useAssistedCheckIn>['snapshot']['status']) {
  if (status === 'tracking') {
    return 'Assisted suggestions are tracking';
  }

  if (status === 'syncing') {
    return 'Assisted tracking is refreshing';
  }

  if (status === 'error') {
    return 'Assisted tracking needs attention';
  }

  if (status === 'manual_only') {
    return 'Manual-only mode is active';
  }

  return 'Assisted tracking is idle';
}

function getStatusBody(snapshot: ReturnType<typeof useAssistedCheckIn>['snapshot']) {
  if (snapshot.status === 'tracking') {
    return 'Your primary gym geofence is synced. Enter and exit events still create suggestions first, and visits only start or end after you accept the action.';
  }

  if (snapshot.status === 'syncing') {
    return 'The app is checking permissions, syncing the primary gym geofence, and restoring any active visit context.';
  }

  if (snapshot.status === 'error') {
    return 'The assisted flow hit an error. You can still add or finish visits manually from the Visits tab while you review permissions and radius settings.';
  }

  return 'This app remains useful without automation. You can keep using manual gym setup, cost tracking, and visit CRUD even when location or notification permissions are unavailable.';
}

export function AssistedCheckInSection() {
  const theme = useAppTheme();
  const { refresh, snapshot } = useAssistedCheckIn();

  return (
    <Card
      subtitle="Assisted check-in is always optional. Manual visit entry remains the fallback if permissions, prompts, or device delivery fail."
      title={getStatusTitle(snapshot.status)}>
      <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>
        {getStatusBody(snapshot)}
      </Text>

      <View style={[styles.metaList, { marginTop: theme.spacing.lg }]}>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Primary gym sync: {snapshot.primaryGymId ?? 'none'}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Location permission:{' '}
          {formatPermissionStatusLabel(snapshot.locationPermission)}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Background location:{' '}
          {formatPermissionStatusLabel(snapshot.backgroundLocationPermission)}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Notification permission:{' '}
          {formatPermissionStatusLabel(snapshot.notificationPermission)}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Tracking enabled: {snapshot.trackingEnabled ? 'yes' : 'no'}
        </Text>
        {snapshot.activeVisitId ? (
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            Restored active visit: {snapshot.activeVisitId}
          </Text>
        ) : null}
        {snapshot.lastPromptId ? (
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            Last prompt: {snapshot.lastPromptId}
          </Text>
        ) : null}
      </View>

      {snapshot.lastError ? (
        <Text style={[styles.warning, { color: theme.colors.warning }]}>
          {snapshot.lastError}
        </Text>
      ) : null}

      {!snapshot.trackingEnabled ? (
        <Text style={[styles.manualOnly, { color: theme.colors.textPrimary }]}>
          If suggestions are unavailable, go to Visits to create, complete, or cancel sessions manually. If prompts feel off later, adjust your gym radius in Settings.
        </Text>
      ) : null}

      <PrimaryButton
        label="Refresh Assisted Tracking"
        onPress={() => {
          refresh().catch(() => {});
        }}
        style={{ marginTop: theme.spacing.xl }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  copy: {
    fontSize: 15,
    lineHeight: 22,
  },
  manualOnly: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaList: {
    gap: 6,
  },
  warning: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
});
