import { useEffect, useState } from 'react';

import type { FeeItem } from '../../../domain/models';
import { getCostItems } from '../useCases/costItems';

type CostItemsLoadState = 'loading' | 'ready' | 'error';

export function useCostItems() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loadState, setLoadState] = useState<CostItemsLoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [costItems, setCostItems] = useState<FeeItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedCostItems() {
      setLoadState('loading');
      setLoadError(null);

      try {
        const nextCostItems = await getCostItems();

        if (!isMounted) {
          return;
        }

        setCostItems(nextCostItems);
        setLoadState('ready');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadState('error');
        setLoadError(
          error instanceof Error ? error.message : 'Unknown cost list query error.',
        );
      }
    }

    loadSavedCostItems();

    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  const activeCount = costItems.filter(costItem => costItem.isActive).length;

  return {
    activeCount,
    costItems,
    inactiveCount: costItems.length - activeCount,
    loadError,
    loadState,
    reload: () => {
      setReloadToken(currentToken => currentToken + 1);
    },
  };
}
