import { useCallback, useEffect, useState } from 'react';

import type { FeeItem } from '../../../domain/models';
import type { FeeItemFormValues } from '../../../domain/forms';
import type { ValidationIssue } from '../../../utils/validation';
import { getSettings } from '../../../data/repositories';
import { getPrimaryGym } from '../../gym/useCases/primaryGym';
import {
  buildCostSetupDraftState,
  createCustomCostSetupLine,
  restoreCostItemToDraftState,
  type CostSetupDraftState,
  type CostSetupLineDraft,
} from '../useCases/costSetup';
import {
  CostSetupFormValidationError,
  saveCostSetup,
} from '../useCases/saveCostSetup';

type CostSetupSupportState = 'loading' | 'ready' | 'error';
type CostSetupSaveState = 'idle' | 'saving' | 'success' | 'error';

function formatSaveFeedback(result: {
  createdCount: number;
  deactivatedCount: number;
  skippedCount: number;
  updatedCount: number;
}) {
  const parts: string[] = [];

  if (result.createdCount > 0) {
    parts.push(`${result.createdCount} created`);
  }

  if (result.updatedCount > 0) {
    parts.push(`${result.updatedCount} updated`);
  }

  if (result.deactivatedCount > 0) {
    parts.push(`${result.deactivatedCount} inactive`);
  }

  if (parts.length === 0) {
    return result.skippedCount > 0
      ? 'No cost rows were saved. Blank or skipped lines were ignored.'
      : 'No cost changes were needed.';
  }

  return `Cost setup saved: ${parts.join(', ')}.`;
}

export function useCostSetupForm({
  costItems,
  onReload,
}: {
  costItems: FeeItem[];
  onReload: () => void;
}) {
  const [supportState, setSupportState] =
    useState<CostSetupSupportState>('loading');
  const [supportError, setSupportError] = useState<string | null>(null);
  const [primaryGym, setPrimaryGym] = useState<Awaited<
    ReturnType<typeof getPrimaryGym>
  > | null>(null);
  const [appSettings, setAppSettings] = useState<Awaited<
    ReturnType<typeof getSettings>
  > | null>(null);
  const [draftState, setDraftState] = useState<CostSetupDraftState>({
    customLines: [],
    starterLines: [],
  });
  const [saveState, setSaveState] = useState<CostSetupSaveState>('idle');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [validationErrorsByLine, setValidationErrorsByLine] = useState<
    Record<string, ValidationIssue[]>
  >({});

  useEffect(() => {
    let isMounted = true;

    async function loadCostSetupSupportData() {
      setSupportState('loading');
      setSupportError(null);

      try {
        const [gym, settings] = await Promise.all([getPrimaryGym(), getSettings()]);

        if (!isMounted) {
          return;
        }

        setPrimaryGym(gym);
        setAppSettings(settings);
        setSupportState('ready');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSupportState('error');
        setSupportError(
          error instanceof Error
            ? error.message
            : 'Unknown cost setup support load error.',
        );
      }
    }

    loadCostSetupSupportData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (supportState !== 'ready') {
      return;
    }

    const nextDraftState = buildCostSetupDraftState(costItems);

    setDraftState(nextDraftState);
    setValidationErrorsByLine({});
  }, [costItems, supportState]);

  const patchLine = useCallback((
    lineId: string,
    updater: (line: CostSetupLineDraft) => CostSetupLineDraft,
  ) => {
    setDraftState(currentDraftState => ({
      customLines: currentDraftState.customLines.map(line =>
        line.draftId === lineId ? updater(line) : line,
      ),
      starterLines: currentDraftState.starterLines.map(line =>
        line.draftId === lineId ? updater(line) : line,
      ),
    }));
    setValidationErrorsByLine(currentErrors => {
      if (!currentErrors[lineId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[lineId];
      return nextErrors;
    });
  }, []);

  return {
    addCustomLine: useCallback(() => {
      setDraftState(currentDraftState => ({
        ...currentDraftState,
        customLines: [
          ...currentDraftState.customLines,
          createCustomCostSetupLine(),
        ],
      }));
      setSaveFeedback(null);
      setSaveState('idle');
    }, []),
    appSettings,
    customLines: draftState.customLines,
    hasPrimaryGym: primaryGym !== null,
    primaryGym,
    restoreCostItem: useCallback((feeItem: FeeItem) => {
      setDraftState(currentDraftState =>
        restoreCostItemToDraftState(currentDraftState, feeItem),
      );
      setValidationErrorsByLine({});
      setSaveFeedback(`Restored ${feeItem.label} to the setup form. Save to reactivate it.`);
      setSaveState('idle');
    }, []),
    removeCustomLine: useCallback((lineId: string) => {
      setDraftState(currentDraftState => ({
        ...currentDraftState,
        customLines: currentDraftState.customLines.filter(
          line => line.draftId !== lineId,
        ),
      }));
      setValidationErrorsByLine(currentErrors => {
        if (!currentErrors[lineId]) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors[lineId];
        return nextErrors;
      });
    }, []),
    save: async () => {
      setSaveState('idle');
      setSaveFeedback(null);

      if (!primaryGym) {
        setSaveState('error');
        setSaveFeedback(
          'Set up your primary gym in Settings before saving cost lines.',
        );
        return null;
      }

      try {
        setSaveState('saving');
        const summary = await saveCostSetup(
          [...draftState.starterLines, ...draftState.customLines],
          {
            appSettings,
            gymId: primaryGym.id,
          },
        );

        setValidationErrorsByLine({});
        setSaveState('success');
        setSaveFeedback(formatSaveFeedback(summary));
        onReload();

        return summary;
      } catch (error) {
        if (error instanceof CostSetupFormValidationError) {
          setValidationErrorsByLine(error.issuesByLine);
          setSaveState('error');
          setSaveFeedback('Review the highlighted cost lines before saving.');
          return null;
        }

        setSaveState('error');
        setSaveFeedback(
          error instanceof Error ? error.message : 'Unknown cost save error.',
        );
        return null;
      }
    },
    saveFeedback,
    saveState,
    setLineFieldValue: useCallback(<Field extends keyof FeeItemFormValues>(
      lineId: string,
      field: Field,
      value: FeeItemFormValues[Field],
    ) => {
      patchLine(lineId, line => ({
        ...line,
        formValues: {
          ...line.formValues,
          ...(field === 'amountInputMode'
            ? {
                gstRate: value === 'custom' ? line.formValues.gstRate : '',
                pstRate: value === 'custom' ? line.formValues.pstRate : '',
                taxMode:
                  value === 'custom'
                    ? 'custom'
                    : value === 'tax_exempt'
                      ? 'none'
                      : 'inherit_default',
              }
            : {}),
          [field]: value,
        },
      }));
      setSaveFeedback(null);
      setSaveState('idle');
    }, [patchLine]),
    starterLines: draftState.starterLines,
    supportError,
    supportState,
    toggleLineAdvanced: useCallback((lineId: string) => {
      patchLine(lineId, line => ({
        ...line,
        showAdvanced: !line.showAdvanced,
      }));
    }, [patchLine]),
    validationErrorsByLine,
  };
}
