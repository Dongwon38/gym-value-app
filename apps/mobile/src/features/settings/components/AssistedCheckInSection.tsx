import React from 'react';
import { Bell, CircleHelp, MapPinned, Route } from 'lucide-react-native';
import { Alert, Platform, Pressable, View } from 'react-native';
import { openSettings } from 'react-native-permissions';

import { useAssistedCheckIn } from '../../../app/providers/AssistedCheckInContext';
import { usePlatformServices } from '../../../platform/services';
import {
  Badge,
  Button,
  Card,
  PermissionChip,
  type PermissionChipTone,
  SettingsRow,
  Text,
  TooltipOverlay,
} from '../../../ui';
import { appTheme } from '../../../ui/theme';

function formatPermissionStatusLabel(status: string | null) {
  if (status === 'granted') {
    return 'Allowed';
  }

  if (status === 'limited') {
    return 'While using';
  }

  if (status === 'denied') {
    return 'Denied';
  }

  if (status === 'blocked') {
    return 'Blocked';
  }

  return 'Unavailable';
}

function getPermissionTone(status: string | null): PermissionChipTone {
  if (status === 'granted') {
    return 'success';
  }

  if (status === 'limited') {
    return 'warning';
  }

  if (status === 'blocked') {
    return 'destructive';
  }

  if (status === 'denied') {
    return 'warning';
  }

  return 'neutral';
}

function showPermissionMenu(options: {
  message: string;
  onRequest: () => Promise<void>;
  refresh: () => Promise<void>;
  status: string | null;
  title: string;
}) {
  const { message, onRequest, refresh, status, title } = options;

  const openSys = () => {
    openSettings().catch(() => {});
  };

  const runRequest = () => {
    void onRequest()
      .then(() => refresh())
      .catch(() => {});
  };

  const isBlocked = status === 'blocked';
  const isGranted = status === 'granted' || status === 'limited';

  if (isBlocked) {
    Alert.alert(title, message, [
      { text: 'Open Settings', onPress: openSys },
      { text: 'Cancel', style: 'cancel' },
    ]);
    return;
  }

  if (isGranted) {
    Alert.alert(title, message, [
      {
        text: 'Open Settings',
        onPress: openSys,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
    return;
  }

  Alert.alert(title, message, [
    { text: 'Request access', onPress: runRequest },
    { text: 'Open Settings', onPress: openSys },
    { text: 'Cancel', style: 'cancel' },
  ]);
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

const bgChipTitle = Platform.OS === 'ios' ? 'Always' : 'Background';
const backgroundRowLabel = Platform.OS === 'ios' ? 'Always (geofence)' : 'Background';

export function AssistedCheckInSection() {
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);
  const { refresh, snapshot } = useAssistedCheckIn();
  const { permissionService } = usePlatformServices();

  const backgroundHint =
    Platform.OS === 'ios'
      ? 'Geofencing needs Location set to Always. If you only chose While Using the App, use Open Settings → Gym Value → Location → Always.'
      : 'Geofencing needs background location. After fine location, allow “all the time” in system settings if prompted.';

  const notificationHint =
    'Allow notifications for check-in and check-out suggestions. Turn them off in system settings anytime.';

  return (
    <>
      <TooltipOverlay
        onClose={() => {
          setInfoOpen(false);
        }}
        title="Device access"
        visible={infoOpen}>
        <View className="gap-3">
          <Text variant="bodyMuted">
            Assisted check-in uses a geofence around your primary gym and local notifications. Tap
            the status chip on each row to request access or open system settings.
          </Text>
          <Text variant="bodyMuted">
            {Platform.OS === 'ios' ? (
              <>
                On iOS, the geofence requires Location:{' '}
                <Text className="font-semibold" variant="bodyMuted">
                  Always
                </Text>
                . Choosing only “While Using the App” when the system asks for broader access is
                not enough.
              </>
            ) : (
              <>
                On Android, allow fine location first, then background / “Allow all the time” when
                prompted so the geofence can run.
              </>
            )}
          </Text>
          <Text variant="bodyMuted">
            To stop suggestions without revoking OS permissions, turn off Check-in / Check-out
            suggestions under Settings → Tracking and save.
          </Text>
        </View>
      </TooltipOverlay>

      <Card description={getStatusBody(snapshot)} shadow="soft" title="Assisted check-in">
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="listMeta">Device access</Text>
          <Pressable
            accessibilityLabel="About device access and permissions"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full active:bg-muted-card"
            hitSlop={8}
            onPress={() => {
              setInfoOpen(true);
            }}>
            <CircleHelp color={appTheme.colors.iconDefault} size={22} strokeWidth={2} />
          </Pressable>
        </View>

        <View>
          <SettingsRow
            icon={<MapPinned color={appTheme.colors.iconDefault} size={18} strokeWidth={2} />}
            label="Location"
            trailing={
              <PermissionChip
                accessibilityLabel={`Location permission, ${formatPermissionStatusLabel(snapshot.locationPermission)}`}
                compact
                onPress={() => {
                  showPermissionMenu({
                    message:
                      'Location is used to detect when you arrive at or leave your primary gym. Use Open Settings to change or revoke access.',
                    onRequest: () => permissionService.requestLocationPermission(),
                    refresh,
                    status: snapshot.locationPermission,
                    title: 'Location',
                  });
                }}
                statusLabel={formatPermissionStatusLabel(snapshot.locationPermission)}
                tone={getPermissionTone(snapshot.locationPermission)}
              />
            }
          />
          <SettingsRow
            icon={<Route color={appTheme.colors.iconDefault} size={18} strokeWidth={2} />}
            label={backgroundRowLabel}
            trailing={
              <PermissionChip
                accessibilityLabel={`${backgroundRowLabel}, ${formatPermissionStatusLabel(snapshot.backgroundLocationPermission)}`}
                compact
                onPress={() => {
                  showPermissionMenu({
                    message: backgroundHint,
                    onRequest: () => permissionService.requestBackgroundLocationPermission(),
                    refresh,
                    status: snapshot.backgroundLocationPermission,
                    title: bgChipTitle,
                  });
                }}
                statusLabel={formatPermissionStatusLabel(snapshot.backgroundLocationPermission)}
                tone={getPermissionTone(snapshot.backgroundLocationPermission)}
              />
            }
          />
          <SettingsRow
            icon={<Bell color={appTheme.colors.iconDefault} size={18} strokeWidth={2} />}
            label="Notifications"
            last
            trailing={
              <PermissionChip
                accessibilityLabel={`Notifications, ${formatPermissionStatusLabel(snapshot.notificationPermission)}`}
                compact
                onPress={() => {
                  showPermissionMenu({
                    message: notificationHint,
                    onRequest: () => permissionService.requestNotificationPermission(),
                    refresh,
                    status: snapshot.notificationPermission,
                    title: 'Notifications',
                  });
                }}
                statusLabel={formatPermissionStatusLabel(snapshot.notificationPermission)}
                tone={getPermissionTone(snapshot.notificationPermission)}
              />
            }
          />
        </View>

        <View className="border-t border-border/60 pt-1">
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
        </View>

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
