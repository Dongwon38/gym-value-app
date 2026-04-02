import { createContext, useContext } from 'react';

import type { AssistedCheckInSnapshot } from '../../features/assistedCheckIn/useCases/assistedCheckInController';

export interface AssistedCheckInContextValue {
  refresh: () => Promise<AssistedCheckInSnapshot>;
  snapshot: AssistedCheckInSnapshot;
}

export const defaultAssistedCheckInSnapshot: AssistedCheckInSnapshot = {
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

export const AssistedCheckInContext =
  createContext<AssistedCheckInContextValue>({
    refresh: async () => defaultAssistedCheckInSnapshot,
    snapshot: defaultAssistedCheckInSnapshot,
  });

export function useAssistedCheckIn() {
  return useContext(AssistedCheckInContext);
}
