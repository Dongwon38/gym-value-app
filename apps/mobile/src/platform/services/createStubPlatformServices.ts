import type { PlatformServices } from './PlatformServices';
import type {
  AppLifecycleState,
  AppStateChangeEvent,
  CheckInNotificationInput,
  CheckOutNotificationInput,
  GeofenceEvent,
  GymGeofenceInput,
  NotificationActionEvent,
  PermissionStatus,
} from './types';

type SubscriptionMap<Event> = Set<(event: Event) => void>;

function emitToSubscriptions<Event>(
  subscriptions: SubscriptionMap<Event>,
  event: Event,
) {
  subscriptions.forEach(handler => {
    handler(event);
  });
}

export interface StubPlatformServices extends PlatformServices {
  emitAppStateChange(nextState: AppLifecycleState): void;
  emitGeofenceEvent(event: GeofenceEvent): void;
  emitNotificationAction(event: NotificationActionEvent): void;
  getCancelledNotificationTags(): string[];
  getRegisteredGeofences(): GymGeofenceInput[];
  getShownCheckInSuggestions(): CheckInNotificationInput[];
  getShownCheckOutSuggestions(): CheckOutNotificationInput[];
  setPermissionStatuses(statuses: {
    backgroundLocationStatus?: PermissionStatus;
    locationStatus?: PermissionStatus;
    notificationStatus?: PermissionStatus;
  }): void;
}

export function createStubPlatformServices(): StubPlatformServices {
  const geofenceSubscriptions: SubscriptionMap<GeofenceEvent> = new Set();
  const notificationSubscriptions: SubscriptionMap<NotificationActionEvent> =
    new Set();
  const lifecycleSubscriptions: SubscriptionMap<AppStateChangeEvent> = new Set();
  const registeredGeofences = new Map<string, GymGeofenceInput>();
  const shownCheckInSuggestions: CheckInNotificationInput[] = [];
  const shownCheckOutSuggestions: CheckOutNotificationInput[] = [];
  const cancelledNotificationTags: string[] = [];

  let appState: AppLifecycleState = 'active';
  let locationStatus: PermissionStatus = 'granted';
  let backgroundLocationStatus: PermissionStatus = 'granted';
  let notificationStatus: PermissionStatus = 'granted';

  return {
    appLifecycleService: {
      getCurrentState: () => appState,
      onAppStateChange: handler => {
        lifecycleSubscriptions.add(handler);

        return () => {
          lifecycleSubscriptions.delete(handler);
        };
      },
    },
    emitAppStateChange(nextState) {
      const event: AppStateChangeEvent = {
        nextState,
        occurredAt: new Date().toISOString(),
        previousState: appState,
      };

      appState = nextState;
      emitToSubscriptions(lifecycleSubscriptions, event);
    },
    emitGeofenceEvent(event) {
      emitToSubscriptions(geofenceSubscriptions, event);
    },
    emitNotificationAction(event) {
      emitToSubscriptions(notificationSubscriptions, event);
    },
    getCancelledNotificationTags: () => cancelledNotificationTags.slice(),
    getRegisteredGeofences: () => Array.from(registeredGeofences.values()),
    getShownCheckInSuggestions: () => shownCheckInSuggestions.slice(),
    getShownCheckOutSuggestions: () => shownCheckOutSuggestions.slice(),
    locationService: {
      getCurrentPosition: async () => ({
        accuracyMeters: 15,
        capturedAt: new Date().toISOString(),
        latitude: 49.2827,
        longitude: -123.1207,
      }),
      initialize: async () => {},
      onGeofenceEvent: handler => {
        geofenceSubscriptions.add(handler);

        return () => {
          geofenceSubscriptions.delete(handler);
        };
      },
      registerGymGeofence: async input => {
        registeredGeofences.set(input.gymId, input);
      },
      removeGymGeofence: async gymId => {
        registeredGeofences.delete(gymId);
      },
    },
    notificationService: {
      cancelByTag: async tag => {
        cancelledNotificationTags.push(tag);
      },
      onActionPress: handler => {
        notificationSubscriptions.add(handler);

        return () => {
          notificationSubscriptions.delete(handler);
        };
      },
      showCheckInSuggestion: async input => {
        shownCheckInSuggestions.push(input);
      },
      showCheckOutSuggestion: async input => {
        shownCheckOutSuggestions.push(input);
      },
    },
    permissionService: {
      getBackgroundLocationStatus: async () => backgroundLocationStatus,
      getLocationStatus: async () => locationStatus,
      getNotificationStatus: async () => notificationStatus,
      requestBackgroundLocationPermission: async () => backgroundLocationStatus,
      requestLocationPermission: async () => locationStatus,
      requestNotificationPermission: async () => notificationStatus,
    },
    setPermissionStatuses(statuses) {
      backgroundLocationStatus =
        statuses.backgroundLocationStatus ?? backgroundLocationStatus;
      locationStatus = statuses.locationStatus ?? locationStatus;
      notificationStatus = statuses.notificationStatus ?? notificationStatus;
    },
  };
}
