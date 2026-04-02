import { useEffect, useState } from 'react';

import type { GymFormValues } from '../../../domain/forms';
import type { Gym } from '../../../domain/models';
import {
  getValidationErrors,
  getValidationWarnings,
  validateGymForm,
} from '../../../utils/validation';
import { getPrimaryGym, mapGymToFormValues } from '../useCases/primaryGym';
import {
  GymFormValidationError,
  savePrimaryGym,
} from '../useCases/savePrimaryGym';

type GymSetupLoadState = 'loading' | 'ready' | 'error';
type GymSetupSaveState = 'idle' | 'saving' | 'success' | 'error';

export function useGymSetupForm() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loadState, setLoadState] = useState<GymSetupLoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<GymSetupSaveState>('idle');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [primaryGym, setPrimaryGym] = useState<Gym | null>(null);
  const [formValues, setFormValues] = useState<GymFormValues>(() =>
    mapGymToFormValues(null),
  );
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPrimaryGym() {
      setLoadState('loading');
      setLoadError(null);

      try {
        const loadedPrimaryGym = await getPrimaryGym();

        if (!isMounted) {
          return;
        }

        setPrimaryGym(loadedPrimaryGym);
        setFormValues(mapGymToFormValues(loadedPrimaryGym));
        setHasReviewed(false);
        setSaveState('idle');
        setSaveFeedback(null);
        setLoadState('ready');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadState('error');
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unknown primary gym query error.',
        );
      }
    }

    loadPrimaryGym();

    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  const validationResult = validateGymForm(formValues);
  const errors = hasReviewed ? getValidationErrors(validationResult) : [];
  const warnings = hasReviewed ? getValidationWarnings(validationResult) : [];

  return {
    errors,
    formValues,
    hasReviewed,
    loadError,
    loadState,
    mode: primaryGym ? 'edit' : 'create',
    primaryGym,
    reload: () => {
      setReloadToken(currentToken => currentToken + 1);
    },
    review: () => {
      setHasReviewed(true);
    },
    save: async () => {
      const operationMode = primaryGym ? 'edit' : 'create';

      setHasReviewed(true);
      setSaveState('idle');
      setSaveFeedback(null);

      if (getValidationErrors(validationResult).length > 0) {
        setSaveState('error');
        setSaveFeedback('Review the highlighted fields before saving.');
        return null;
      }

      try {
        setSaveState('saving');
        const savedGym = await savePrimaryGym(formValues, primaryGym?.id);

        setPrimaryGym(savedGym);
        setFormValues(mapGymToFormValues(savedGym));
        setSaveState('success');
        setSaveFeedback(
          operationMode === 'edit'
            ? 'Primary gym updated.'
            : 'Primary gym created.',
        );

        return savedGym;
      } catch (error) {
        if (error instanceof GymFormValidationError) {
          setSaveState('error');
          setSaveFeedback('Review the highlighted fields before saving.');
          return null;
        }

        setSaveState('error');
        setSaveFeedback(
          error instanceof Error ? error.message : 'Unknown gym save error.',
        );
        return null;
      }
    },
    saveFeedback,
    saveState,
    setFieldValue: <Field extends keyof GymFormValues>(
      field: Field,
      value: GymFormValues[Field],
    ) => {
      setFormValues(currentValues => ({
        ...currentValues,
        [field]: value,
      }));
    },
    warnings,
  };
}
