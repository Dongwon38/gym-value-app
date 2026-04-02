import type { AppLifecycleState, AppStateChangeEvent, Unsubscribe } from './types';

export interface AppLifecycleService {
  getCurrentState(): AppLifecycleState;
  onAppStateChange(
    handler: (event: AppStateChangeEvent) => void,
  ): Unsubscribe;
}
