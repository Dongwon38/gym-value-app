import { defaultAppSettingsValues } from '../../../domain/constants';
import type { AppSettings, Gym, Visit } from '../../../domain/models';
import type { PlatformServices, PermissionStatus, Unsubscribe } from '../../../platform/services';

export type AssistedCheckInStatus =
  | 'idle'
  | 'syncing'
  | 'tracking'
  | 'manual_only'
  | 'error';

export interface AssistedCheckInSnapshot {
  activeVisitId: string | null;
  backgroundLocationPermission: PermissionStatus | null;
  lastError: string | null;
  lastPromptId: string | null;
  locationPermission: PermissionStatus | null;
  notificationPermission: PermissionStatus | null;
  primaryGymId: string | null;
  status: AssistedCheckInStatus;
  trackingEnabled: boolean;
}

export interface AssistedCheckInControllerDependencies
  extends PlatformServices {
  completeActiveVisit: (promptId: string) => Promise<{
    prompt: { id: string };
    visit: { id: string };
  }>;
  dismissLocationPrompt: (promptId: string) => Promise<{ id: string }>;
  getActiveVisit: () => Promise<Visit | null>;
  getPrimaryGym: () => Promise<Gym | null>;
  getSettings: () => Promise<
    Pick<AppSettings, 'checkinSuggestionsEnabled' | 'checkoutSuggestionsEnabled'> | null
  >;
  recordLocationPromptFromGeofenceEvent: (
    event: Parameters<PlatformServices['locationService']['onGeofenceEvent']>[0] extends (
      input: infer Event,
    ) => void
      ? Event
      : never,
  ) => Promise<{ id: string }>;
  recordSuggestedLocationPrompt: (input: {
    gymId: string;
    occurredAt: string;
    relatedVisitId?: string | null;
    type: 'checkin_suggested' | 'checkout_suggested';
  }) => Promise<{ id: string }>;
  startVisitFromPrompt: (promptId: string) => Promise<{
    prompt: { id: string };
    visit: { id: string };
  }>;
}

function createInitialSnapshot(): AssistedCheckInSnapshot {
  return {
    activeVisitId: null,
    backgroundLocationPermission: null,
    lastError: null,
    lastPromptId: null,
    locationPermission: null,
    notificationPermission: null,
    primaryGymId: null,
    status: 'idle',
    trackingEnabled: false,
  };
}

function resolveSettings(settings: AppSettings | null) {
  return settings ?? {
    checkinSuggestionsEnabled: defaultAppSettingsValues.checkinSuggestionsEnabled,
    checkoutSuggestionsEnabled: defaultAppSettingsValues.checkoutSuggestionsEnabled,
  };
}

function canEnableTracking(input: {
  backgroundLocationPermission: PermissionStatus;
  gym: Gym | null;
  locationPermission: PermissionStatus;
  notificationPermission: PermissionStatus;
  settings: Pick<AppSettings, 'checkinSuggestionsEnabled' | 'checkoutSuggestionsEnabled'>;
}) {
  const suggestionsEnabled =
    input.settings.checkinSuggestionsEnabled ||
    input.settings.checkoutSuggestionsEnabled;

  return (
    suggestionsEnabled &&
    input.gym !== null &&
    input.locationPermission === 'granted' &&
    input.backgroundLocationPermission === 'granted' &&
    input.notificationPermission === 'granted'
  );
}

export function createAssistedCheckInController(
  dependencies: AssistedCheckInControllerDependencies,
) {
  const listeners = new Set<(snapshot: AssistedCheckInSnapshot) => void>();
  let snapshot = createInitialSnapshot();
  let subscriptions: Unsubscribe[] = [];
  let syncedGymId: string | null = null;
  let currentGym: Gym | null = null;
  let currentVisit: Visit | null = null;
  let currentSettings = resolveSettings(null);
  let startPromise: Promise<AssistedCheckInSnapshot> | null = null;

  function publish(nextSnapshot: AssistedCheckInSnapshot) {
    snapshot = nextSnapshot;
    listeners.forEach(listener => {
      listener(snapshot);
    });
  }

  function updateSnapshot(
    partial: Partial<AssistedCheckInSnapshot>,
    options?: { preserveStatus?: boolean },
  ) {
    publish({
      ...snapshot,
      ...partial,
      status:
        options?.preserveStatus && partial.status === undefined
          ? snapshot.status
          : partial.status ?? snapshot.status,
    });
  }

  async function syncGeofenceRegistration(input: {
    backgroundLocationPermission: PermissionStatus;
    gym: Gym | null;
    locationPermission: PermissionStatus;
    notificationPermission: PermissionStatus;
    settings: Pick<AppSettings, 'checkinSuggestionsEnabled' | 'checkoutSuggestionsEnabled'>;
  }) {
    const trackingEnabled = canEnableTracking(input);

    if (syncedGymId && (!trackingEnabled || syncedGymId !== input.gym?.id)) {
      await dependencies.locationService.removeGymGeofence(syncedGymId);
      syncedGymId = null;
    }

    if (trackingEnabled && input.gym) {
      await dependencies.locationService.registerGymGeofence({
        gymId: input.gym.id,
        gymName: input.gym.name,
        latitude: input.gym.latitude,
        longitude: input.gym.longitude,
        radiusMeters: input.gym.radiusMeters,
      });
      syncedGymId = input.gym.id;

      updateSnapshot({
        activeVisitId: currentVisit?.id ?? null,
        backgroundLocationPermission: input.backgroundLocationPermission,
        lastError: null,
        locationPermission: input.locationPermission,
        notificationPermission: input.notificationPermission,
        primaryGymId: input.gym.id,
        status: 'tracking',
        trackingEnabled: true,
      });

      return;
    }

    updateSnapshot({
      activeVisitId: currentVisit?.id ?? null,
      backgroundLocationPermission: input.backgroundLocationPermission,
      lastError: null,
      locationPermission: input.locationPermission,
      notificationPermission: input.notificationPermission,
      primaryGymId: input.gym?.id ?? null,
      status: 'manual_only',
      trackingEnabled: false,
    });
  }

  async function refresh() {
    updateSnapshot({ status: 'syncing' });

    try {
      await dependencies.locationService.initialize();

      const [
        gym,
        settings,
        activeVisit,
        locationPermission,
        backgroundLocationPermission,
        notificationPermission,
      ] = await Promise.all([
        dependencies.getPrimaryGym(),
        dependencies.getSettings(),
        dependencies.getActiveVisit(),
        dependencies.permissionService.getLocationStatus(),
        dependencies.permissionService.getBackgroundLocationStatus(),
        dependencies.permissionService.getNotificationStatus(),
      ]);

      currentGym = gym;
      currentSettings = resolveSettings(settings);
      currentVisit = activeVisit;

      await syncGeofenceRegistration({
        backgroundLocationPermission,
        gym,
        locationPermission,
        notificationPermission,
        settings: currentSettings,
      });

      return snapshot;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown assisted check-in error.';

      updateSnapshot({
        activeVisitId: currentVisit?.id ?? null,
        lastError: message,
        primaryGymId: currentGym?.id ?? null,
        status: 'error',
        trackingEnabled: false,
      });

      return snapshot;
    }
  }

  async function handleGeofenceEvent(
    event: Parameters<
      AssistedCheckInControllerDependencies['locationService']['onGeofenceEvent']
    >[0] extends (input: infer Event) => void
      ? Event
      : never,
  ) {
    try {
      const rawPrompt =
        await dependencies.recordLocationPromptFromGeofenceEvent(event);

      updateSnapshot(
        {
          lastError: null,
          lastPromptId: rawPrompt.id,
        },
        { preserveStatus: true },
      );

      if (
        event.type === 'enter' &&
        currentSettings.checkinSuggestionsEnabled &&
        currentVisit === null
      ) {
        const suggestionPrompt = await dependencies.recordSuggestedLocationPrompt({
          gymId: event.gymId,
          occurredAt: event.occurredAt,
          type: 'checkin_suggested',
        });

        await dependencies.notificationService.showCheckInSuggestion({
          gymId: event.gymId,
          gymName: currentGym?.name ?? 'Primary Gym',
          occurredAt: event.occurredAt,
          promptId: suggestionPrompt.id,
        });

        updateSnapshot(
          {
            lastPromptId: suggestionPrompt.id,
          },
          { preserveStatus: true },
        );
      }

      if (
        event.type === 'exit' &&
        currentSettings.checkoutSuggestionsEnabled &&
        currentVisit !== null &&
        currentVisit.gymId === event.gymId
      ) {
        const suggestionPrompt = await dependencies.recordSuggestedLocationPrompt({
          gymId: event.gymId,
          occurredAt: event.occurredAt,
          relatedVisitId: currentVisit.id,
          type: 'checkout_suggested',
        });

        await dependencies.notificationService.showCheckOutSuggestion({
          gymId: event.gymId,
          gymName: currentGym?.name ?? 'Primary Gym',
          occurredAt: event.occurredAt,
          promptId: suggestionPrompt.id,
          startedAt: currentVisit.startedAt,
        });

        updateSnapshot(
          {
            lastPromptId: suggestionPrompt.id,
          },
          { preserveStatus: true },
        );
      }
    } catch (error) {
      updateSnapshot(
        {
          lastError:
            error instanceof Error
              ? error.message
              : 'Unknown geofence handling error.',
        },
        { preserveStatus: true },
      );
    }
  }

  async function handleNotificationAction(
    event: Parameters<
      AssistedCheckInControllerDependencies['notificationService']['onActionPress']
    >[0] extends (input: infer ActionEvent) => void
      ? ActionEvent
      : never,
  ) {
    try {
      if (event.actionId === 'check_in') {
        const result = await dependencies.startVisitFromPrompt(event.promptId);

        currentVisit = result.visit;
        await dependencies.notificationService.cancelByTag(event.promptId);
        updateSnapshot(
          {
            activeVisitId: result.visit.id,
            lastError: null,
            lastPromptId: result.prompt.id,
          },
          { preserveStatus: true },
        );

        return;
      }

      if (event.actionId === 'check_out') {
        const result = await dependencies.completeActiveVisit(event.promptId);

        currentVisit = null;
        await dependencies.notificationService.cancelByTag(event.promptId);
        updateSnapshot(
          {
            activeVisitId: null,
            lastError: null,
            lastPromptId: result.prompt.id,
          },
          { preserveStatus: true },
        );

        return;
      }

      if (event.actionId === 'dismiss') {
        const prompt = await dependencies.dismissLocationPrompt(event.promptId);

        await dependencies.notificationService.cancelByTag(event.promptId);
        updateSnapshot(
          {
            lastError: null,
            lastPromptId: prompt.id,
          },
          { preserveStatus: true },
        );
      }
    } catch (error) {
      updateSnapshot(
        {
          lastError:
            error instanceof Error
              ? error.message
              : 'Unknown notification action error.',
        },
        { preserveStatus: true },
      );
    }
  }

  return {
    getSnapshot() {
      return snapshot;
    },
    async refresh() {
      return refresh();
    },
    subscribe(listener: (nextSnapshot: AssistedCheckInSnapshot) => void) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    start() {
      if (startPromise) {
        return startPromise;
      }

      subscriptions = [
        dependencies.locationService.onGeofenceEvent(event => {
          handleGeofenceEvent(event).catch(() => {});
        }),
        dependencies.notificationService.onActionPress(event => {
          handleNotificationAction(event).catch(() => {});
        }),
      ];

      startPromise = refresh();

      return startPromise;
    },
    stop() {
      subscriptions.forEach(unsubscribe => {
        unsubscribe();
      });
      subscriptions = [];
      startPromise = null;
    },
  };
}
