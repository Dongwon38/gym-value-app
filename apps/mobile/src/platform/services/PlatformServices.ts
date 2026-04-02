import type { AppLifecycleService } from './AppLifecycleService';
import type { LocationService } from './LocationService';
import type { NotificationService } from './NotificationService';
import type { PermissionService } from './PermissionService';

export interface PlatformServices {
  appLifecycleService: AppLifecycleService;
  locationService: LocationService;
  notificationService: NotificationService;
  permissionService: PermissionService;
}
