export type PermissionStatus = 'unavailable' | 'denied' | 'granted' | 'blocked';

export type Unsubscribe = () => void;

export type GeofenceEventType = 'enter' | 'exit';

export interface GymGeofenceInput {
  gymId: string;
  gymName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface GeofenceEvent {
  gymId: string;
  latitude: number | null;
  longitude: number | null;
  occurredAt: string;
  radiusMeters: number | null;
  source: 'platform' | 'test';
  type: GeofenceEventType;
}

export interface CurrentPositionResult {
  accuracyMeters: number | null;
  capturedAt: string;
  latitude: number;
  longitude: number;
}

export interface CheckInNotificationInput {
  gymId: string;
  gymName: string;
  occurredAt: string;
  promptId: string;
}

export interface CheckOutNotificationInput {
  gymId: string;
  gymName: string;
  occurredAt: string;
  promptId: string;
  startedAt: string;
}

export type NotificationActionId =
  | 'check_in'
  | 'check_out'
  | 'open_app'
  | 'dismiss';

export interface NotificationActionEvent {
  actionId: NotificationActionId;
  gymId: string;
  occurredAt: string;
  promptId: string;
}

export type AppLifecycleState = 'active' | 'inactive' | 'background';

export interface AppStateChangeEvent {
  nextState: AppLifecycleState;
  occurredAt: string;
  previousState: AppLifecycleState | null;
}
