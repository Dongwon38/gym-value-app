import { useEffect, useState } from 'react';

import type { DashboardRangeType } from '../../../domain/models';
import {
  getHomeDashboardSnapshot,
  type HomeDashboardSnapshot,
} from '../useCases/dashboard';

type HomeDashboardLoadState = 'loading' | 'ready' | 'error';

export function useHomeDashboard(rangeType: DashboardRangeType = 'current_year') {
  const [reloadToken, setReloadToken] = useState(0);
  const [loadState, setLoadState] = useState<HomeDashboardLoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<HomeDashboardSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardSnapshot() {
      setLoadState('loading');
      setLoadError(null);

      try {
        const nextSnapshot = await getHomeDashboardSnapshot(rangeType);

        if (!isMounted) {
          return;
        }

        setSnapshot(nextSnapshot);
        setLoadState('ready');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadState('error');
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unknown home dashboard query error.',
        );
      }
    }

    loadDashboardSnapshot();

    return () => {
      isMounted = false;
    };
  }, [rangeType, reloadToken]);

  return {
    loadError,
    loadState,
    reload: () => {
      setReloadToken(currentToken => currentToken + 1);
    },
    snapshot,
  };
}
