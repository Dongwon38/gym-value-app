import { useCallback, useEffect, useState } from 'react';

import type { Visit } from '../../../domain/models';
import { getVisits } from '../useCases/visits';

type VisitsLoadState = 'loading' | 'ready' | 'error';

export function useVisits() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loadState, setLoadState] = useState<VisitsLoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadVisits() {
      setLoadState('loading');
      setLoadError(null);

      try {
        const nextVisits = await getVisits();

        if (!isMounted) {
          return;
        }

        setVisits(nextVisits);
        setLoadState('ready');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadState('error');
        setLoadError(
          error instanceof Error ? error.message : 'Unknown visit list query error.',
        );
      }
    }

    loadVisits();

    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  const activeCount = visits.filter(visit => visit.status === 'active').length;
  const reload = useCallback(() => {
    setReloadToken(currentToken => currentToken + 1);
  }, []);

  return {
    activeCount,
    loadError,
    loadState,
    reload,
    visits,
  };
}
