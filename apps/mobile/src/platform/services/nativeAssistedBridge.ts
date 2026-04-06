import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

import type { GeofenceEvent, NotificationActionEvent } from './types';

type GymGeofenceNative = {
  addRegion: (
    gymId: string,
    gymName: string,
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ) => Promise<unknown>;
  removeRegion: (gymId: string) => Promise<unknown>;
};

type GymAssistedNotificationsNative = {
  cancelByTag: (tag: string) => Promise<unknown>;
  showCheckInSuggestion: (
    gymId: string,
    gymName: string,
    occurredAt: string,
    promptId: string,
  ) => Promise<unknown>;
  showCheckOutSuggestion: (
    gymId: string,
    gymName: string,
    occurredAt: string,
    promptId: string,
    startedAt: string,
  ) => Promise<unknown>;
};

export function getGymGeofenceNative(): GymGeofenceNative | null {
  const mod = NativeModules.GymGeofence as GymGeofenceNative | undefined;
  if (!mod?.addRegion || !mod?.removeRegion) {
    return null;
  }
  return mod;
}

export function getGymAssistedNotificationsNative(): GymAssistedNotificationsNative | null {
  const mod = NativeModules.GymAssistedNotifications as
    | GymAssistedNotificationsNative
    | undefined;
  if (
    !mod?.showCheckInSuggestion ||
    !mod?.showCheckOutSuggestion ||
    !mod?.cancelByTag
  ) {
    return null;
  }
  return mod;
}

function mapGeofencePayload(raw: Record<string, unknown>): GeofenceEvent {
  return {
    gymId: String(raw.gymId ?? ''),
    latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
    occurredAt: String(raw.occurredAt ?? ''),
    radiusMeters: typeof raw.radiusMeters === 'number' ? raw.radiusMeters : null,
    source: 'platform',
    type: raw.type === 'exit' ? 'exit' : 'enter',
  };
}

function mapNotificationActionPayload(
  raw: Record<string, unknown>,
): NotificationActionEvent | null {
  const actionId = raw.actionId;
  const gymId = String(raw.gymId ?? '');
  const promptId = String(raw.promptId ?? '');
  const occurredAt = String(raw.occurredAt ?? '');
  if (
    actionId !== 'check_in' &&
    actionId !== 'check_out' &&
    actionId !== 'open_app' &&
    actionId !== 'dismiss'
  ) {
    return null;
  }
  return {
    actionId,
    gymId,
    occurredAt,
    promptId,
  };
}

export function subscribeNativeGeofenceTransitions(
  handler: (event: GeofenceEvent) => void,
): () => void {
  const bridgeHandler = (raw: Record<string, unknown>) => {
    handler(mapGeofencePayload(raw));
  };

  if (Platform.OS === 'ios') {
    const mod = NativeModules.GymGeofence;
    const emitter = new NativeEventEmitter(mod);
    const sub = emitter.addListener('GeofenceTransition', bridgeHandler);
    return () => sub.remove();
  }

  if (Platform.OS === 'android') {
    const sub = DeviceEventEmitter.addListener(
      'GeofenceTransition',
      bridgeHandler,
    );
    return () => sub.remove();
  }

  return () => {};
}

export function subscribeNativeAssistedNotificationActions(
  handler: (event: NotificationActionEvent) => void,
): () => void {
  const bridgeHandler = (raw: Record<string, unknown>) => {
    const mapped = mapNotificationActionPayload(raw);
    if (mapped) {
      handler(mapped);
    }
  };

  if (Platform.OS === 'ios') {
    const mod = NativeModules.GymAssistedNotifications;
    const emitter = new NativeEventEmitter(mod);
    const sub = emitter.addListener('AssistedNotificationAction', bridgeHandler);
    return () => sub.remove();
  }

  if (Platform.OS === 'android') {
    const sub = DeviceEventEmitter.addListener(
      'AssistedNotificationAction',
      bridgeHandler,
    );
    return () => sub.remove();
  }

  return () => {};
}
