import React, {
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';

import { createDefaultAssistedCheckInController } from '../../features/assistedCheckIn/useCases/createDefaultAssistedCheckInController';
import type { AssistedCheckInSnapshot } from '../../features/assistedCheckIn/useCases/assistedCheckInController';
import { usePlatformServices } from '../../platform/services';
import { AssistedCheckInContext } from './AssistedCheckInContext';

export function AssistedCheckInProvider({ children }: PropsWithChildren) {
  const services = usePlatformServices();
  const [controller] = useState(() =>
    createDefaultAssistedCheckInController(services),
  );
  const [snapshot, setSnapshot] = useState<AssistedCheckInSnapshot>(
    controller.getSnapshot(),
  );

  useEffect(() => {
    const unsubscribe = controller.subscribe(nextSnapshot => {
      setSnapshot(nextSnapshot);
    });

    controller.start().catch(() => {});

    return () => {
      unsubscribe();
      controller.stop();
    };
  }, [controller]);

  return (
    <AssistedCheckInContext.Provider
      value={{
        refresh: () => controller.refresh(),
        snapshot,
      }}>
      {children}
    </AssistedCheckInContext.Provider>
  );
}
