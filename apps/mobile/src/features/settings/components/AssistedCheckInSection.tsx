import React from 'react';
import { Bell, MapPinned, Route } from 'lucide-react-native';
import { View } from 'react-native';

import { useAssistedCheckIn } from '../../../app/providers/AssistedCheckInContext';
import {
  Badge,
  Button,
  Card,
  SectionHeader,
  SettingsRow,
  Text,
} from '../../../ui';
import { appTheme } from '../../../ui/theme';

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
    return 'destructive' as const;
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
    return 'destructive' as const;
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
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);
  const { refresh, snapshot } = useAssistedCheckIn();

  return (
    <>
      <View className="gap-3">
        <SectionHeader label="Permissions" title="Device access" />
        <Card padding="compact" shadow="soft">
          <SettingsRow
            icon={<MapPinned color={appTheme.colors.iconDefault} size={18} strokeWidth={2} />}
            label="Location"
            trailing={
              <Badge
                label={formatPermissionStatusLabel(snapshot.locationPermission)}
                tone={getPermissionTone(snapshot.locationPermission)}
              />
            }
          />
          <SettingsRow
            icon={<Route color={appTheme.colors.iconDefault} size={18} strokeWidth={2} />}
            label="Background"
            trailing={
              <Badge
                label={formatPermissionStatusLabel(snapshot.backgroundLocationPermission)}
                tone={getPermissionTone(snapshot.backgroundLocationPermission)}
              />
            }
          />
          <SettingsRow
            icon={<Bell color={appTheme.colors.iconDefault} size={18} strokeWidth={2} />}
            label="Notifications"
            last
            trailing={
              <Badge
                label={formatPermissionStatusLabel(snapshot.notificationPermission)}
                tone={getPermissionTone(snapshot.notificationPermission)}
              />
            }
          />
        </Card>
      </View>

      <Card description={getStatusBody(snapshot)} shadow="soft" title="Assisted check-in">
        <SettingsRow
          label="Status"
          trailing={
            <Badge
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

        {snapshot.lastError ? (
          <Text className="mt-1" tone="warning" variant="bodyMuted">
            {snapshot.lastError}
          </Text>
        ) : null}

        <View className="mt-1 flex-row items-center justify-between gap-3">
          <Button
            label="Refresh"
            onPress={() => {
              refresh().catch(() => {});
            }}
            size="sm"
            variant="secondary"
          />
          <Button
            label={showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
            onPress={() => {
              setShowDiagnostics(currentValue => !currentValue);
            }}
            size="sm"
            variant="ghost"
          />
        </View>

        {showDiagnostics ? (
          <Card className="mt-1" padding="compact" shadow="none" variant="muted">
            <View className="gap-2">
              <Text tone="secondary" variant="listMeta">
                Primary gym ID: {snapshot.primaryGymId ?? 'none'}
              </Text>
              <Text tone="secondary" variant="listMeta">
                Active visit ID: {snapshot.activeVisitId ?? 'none'}
              </Text>
              <Text tone="secondary" variant="listMeta">
                Last prompt ID: {snapshot.lastPromptId ?? 'none'}
              </Text>
            </View>
          </Card>
        ) : null}
      </Card>
    </>
  );
}
