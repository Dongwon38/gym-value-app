import Geolocation from '@react-native-community/geolocation';
import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  checkNotifications,
  request,
  requestNotifications,
  type PermissionStatus as RNPermissionStatus,
} from 'react-native-permissions';

import type { PlatformServices } from './PlatformServices';
import type {
  CurrentPositionResult,
  GeofenceEvent,
  NotificationActionEvent,
  PermissionStatus,
} from './types';
import { createNoopPlatformServices } from './createNoopPlatformServices';
import {
  getGymAssistedNotificationsNative,
  getGymGeofenceNative,
  subscribeNativeAssistedNotificationActions,
  subscribeNativeGeofenceTransitions,
} from './nativeAssistedBridge';

const LOCATION_FETCH_TIMEOUT_MS = 5000;
const LOCATION_MAXIMUM_AGE_MS = 300_000;

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

function mapRnPermissionStatus(result: RNPermissionStatus): PermissionStatus {
  switch (result) {
    case RESULTS.UNAVAILABLE:
      return 'unavailable';
    case RESULTS.DENIED:
      return 'denied';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return 'granted';
    default:
      return 'unavailable';
  }
}

/**
 * Geofence / “always” background — LIMITED must not count as granted (iOS When-in-use / reduced accuracy).
 */
function mapBackgroundLocationPermissionStatus(
  result: RNPermissionStatus,
): PermissionStatus {
  if (result === RESULTS.LIMITED) {
    return 'denied';
  }
  return mapRnPermissionStatus(result);
}

function foregroundLocationPermission() {
  return Platform.OS === 'ios'
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
}

function getCurrentPositionNative(): Promise<CurrentPositionResult | null> {
  return new Promise(resolve => {
    const done = (value: CurrentPositionResult | null) => {
      clearTimeout(failsafeTimer);
      resolve(value);
    };

    const failsafeTimer = setTimeout(() => {
      done(null);
    }, LOCATION_FETCH_TIMEOUT_MS + 250);

    Geolocation.getCurrentPosition(
      position => {
        done({
          accuracyMeters:
            typeof position.coords.accuracy === 'number' &&
            Number.isFinite(position.coords.accuracy)
              ? position.coords.accuracy
              : null,
          capturedAt: new Date(position.timestamp).toISOString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        done(null);
      },
      {
        enableHighAccuracy: false,
        maximumAge: LOCATION_MAXIMUM_AGE_MS,
        timeout: LOCATION_FETCH_TIMEOUT_MS,
      },
    );
  });
}

const geofenceBridge = createSubscriptionSet<GeofenceEvent>();
const notificationActionBridge = createSubscriptionSet<NotificationActionEvent>();

subscribeNativeGeofenceTransitions(event => {
  geofenceBridge.emit(event);
});

subscribeNativeAssistedNotificationActions(event => {
  notificationActionBridge.emit(event);
});

export function createNativePlatformServices(): PlatformServices {
  const base = createNoopPlatformServices();
  const gymGeo = getGymGeofenceNative();
  const gymNotif = getGymAssistedNotificationsNative();

  return {
    ...base,
    locationService: {
      ...base.locationService,
      getCurrentPosition: getCurrentPositionNative,
      onGeofenceEvent: handler => geofenceBridge.add(handler),
      registerGymGeofence: async input => {
        if (!gymGeo) {
          return;
        }
        await gymGeo.addRegion(
          input.gymId,
          input.gymName,
          input.latitude,
          input.longitude,
          input.radiusMeters,
        );
      },
      removeGymGeofence: async gymId => {
        if (!gymGeo) {
          return;
        }
        await gymGeo.removeRegion(gymId);
      },
    },
    notificationService: {
      ...base.notificationService,
      cancelByTag: async tag => {
        if (gymNotif) {
          await gymNotif.cancelByTag(tag);
        }
      },
      onActionPress: handler => notificationActionBridge.add(handler),
      showCheckInSuggestion: async input => {
        if (gymNotif) {
          await gymNotif.showCheckInSuggestion(
            input.gymId,
            input.gymName,
            input.occurredAt,
            input.promptId,
          );
        }
      },
      showCheckOutSuggestion: async input => {
        if (gymNotif) {
          await gymNotif.showCheckOutSuggestion(
            input.gymId,
            input.gymName,
            input.occurredAt,
            input.promptId,
            input.startedAt,
          );
        }
      },
    },
    permissionService: {
      ...base.permissionService,
      getBackgroundLocationStatus: async () => {
        try {
          const permission =
            Platform.OS === 'ios'
              ? PERMISSIONS.IOS.LOCATION_ALWAYS
              : PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
          const result = await check(permission);
          return mapBackgroundLocationPermissionStatus(result);
        } catch {
          return 'denied';
        }
      },
      getLocationStatus: async () => {
        try {
          const result = await check(foregroundLocationPermission());
          return mapRnPermissionStatus(result);
        } catch {
          return 'unavailable';
        }
      },
      getNotificationStatus: async () => {
        try {
          const response = await checkNotifications();
          return mapRnPermissionStatus(response.status);
        } catch {
          return 'unavailable';
        }
      },
      requestBackgroundLocationPermission: async () => {
        try {
          const permission =
            Platform.OS === 'ios'
              ? PERMISSIONS.IOS.LOCATION_ALWAYS
              : PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
          const result = await request(permission);
          return mapBackgroundLocationPermissionStatus(result);
        } catch {
          return 'unavailable';
        }
      },
      requestLocationPermission: async () => {
        try {
          const result = await request(foregroundLocationPermission());
          return mapRnPermissionStatus(result);
        } catch {
          return 'unavailable';
        }
      },
      requestNotificationPermission: async () => {
        try {
          const response = await requestNotifications([
            'alert',
            'sound',
            'badge',
          ]);
          return mapRnPermissionStatus(response.status);
        } catch {
          return 'unavailable';
        }
      },
    },
  };
}
