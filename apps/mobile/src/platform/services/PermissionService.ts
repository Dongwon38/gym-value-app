import type { PermissionStatus } from './types';

export interface PermissionService {
  getBackgroundLocationStatus(): Promise<PermissionStatus>;
  getLocationStatus(): Promise<PermissionStatus>;
  getNotificationStatus(): Promise<PermissionStatus>;
  requestBackgroundLocationPermission(): Promise<PermissionStatus>;
  requestLocationPermission(): Promise<PermissionStatus>;
  requestNotificationPermission(): Promise<PermissionStatus>;
}
