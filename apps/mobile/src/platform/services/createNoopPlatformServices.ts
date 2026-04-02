import type { PlatformServices } from './PlatformServices';
import type {
  AppStateChangeEvent,
  GeofenceEvent,
  NotificationActionEvent,
  PermissionStatus,
} from './types';

function createSubscriptionSet<Event>() {
  const handlers = new Set<(event: Event) => void>();

  return {
    add(handler: (event: Event) => void) {
      handlers.add(handler);

      return () => {
        handlers.delete(handler);
      };
    },
    emit(event: Event) {
      handlers.forEach(handler => {
        handler(event);
      });
    },
  };
}

export function createNoopPlatformServices(
  defaults?: Partial<{
    backgroundLocationStatus: PermissionStatus;
    lifecycleState: 'active' | 'inactive' | 'background';
    locationStatus: PermissionStatus;
    notificationStatus: PermissionStatus;
  }>,
): PlatformServices {
  const geofenceSubscriptions = createSubscriptionSet<GeofenceEvent>();
  const notificationSubscriptions = createSubscriptionSet<NotificationActionEvent>();
  const lifecycleSubscriptions = createSubscriptionSet<AppStateChangeEvent>();

  const locationStatus = defaults?.locationStatus ?? 'unavailable';
  const backgroundLocationStatus =
    defaults?.backgroundLocationStatus ?? locationStatus;
  const notificationStatus = defaults?.notificationStatus ?? 'unavailable';
  const lifecycleState = defaults?.lifecycleState ?? 'active';

  return {
    appLifecycleService: {
      getCurrentState: () => lifecycleState,
      onAppStateChange: handler => lifecycleSubscriptions.add(handler),
    },
    locationService: {
      getCurrentPosition: async () => null,
      initialize: async () => {},
      onGeofenceEvent: handler => geofenceSubscriptions.add(handler),
      registerGymGeofence: async () => {},
      removeGymGeofence: async () => {},
    },
    notificationService: {
      cancelByTag: async () => {},
      onActionPress: handler => notificationSubscriptions.add(handler),
      showCheckInSuggestion: async () => {},
      showCheckOutSuggestion: async () => {},
    },
    permissionService: {
      getBackgroundLocationStatus: async () => backgroundLocationStatus,
      getLocationStatus: async () => locationStatus,
      getNotificationStatus: async () => notificationStatus,
      requestBackgroundLocationPermission: async () => backgroundLocationStatus,
      requestLocationPermission: async () => locationStatus,
      requestNotificationPermission: async () => notificationStatus,
    },
  };
}
