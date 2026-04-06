import { useCallback, useState } from 'react';

import { usePlatformServices } from '../../platform/services';
import type { CurrentPositionResult, PermissionStatus } from '../../platform/services';

/**
 * On-demand foreground location only. Do not call refresh() from useEffect on mount.
 */
export function useDeviceLocation() {
  const { locationService, permissionService } = usePlatformServices();
  const [coords, setCoords] = useState<CurrentPositionResult | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      let status = await permissionService.getLocationStatus();
      setPermissionStatus(status);
      if (status !== 'granted') {
        status = await permissionService.requestLocationPermission();
        setPermissionStatus(status);
      }
      if (status !== 'granted') {
        setCoords(null);
        return null;
      }
      const position = await locationService.getCurrentPosition();
      setCoords(position);
      return position;
    } finally {
      setIsRefreshing(false);
    }
  }, [locationService, permissionService]);

  const clearDeviceCoords = useCallback(() => {
    setCoords(null);
    setPermissionStatus(null);
  }, []);

  return {
    clearDeviceCoords,
    coords,
    isRefreshing,
    permissionStatus,
    refresh,
  };
}
