import { useEffect, useMemo, useState } from 'react';

import type { AppSettingsFormValues } from '../../../domain/forms';
import type { AppSettings } from '../../../domain/models';
import { getAppSettings, mapAppSettingsToFormValues } from '../useCases/appSettings';
import {
  AppSettingsFormValidationError,
  saveAppSettings,
  validateAppSettingsForm,
} from '../useCases/saveAppSettings';

type AppSettingsLoadState = 'loading' | 'ready' | 'error';
type AppSettingsSaveState = 'idle' | 'saving' | 'success' | 'error';

export function useAppSettingsForm() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loadState, setLoadState] = useState<AppSettingsLoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<AppSettingsSaveState>('idle');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [formValues, setFormValues] = useState<AppSettingsFormValues>(() =>
    mapAppSettingsToFormValues(null),
  );
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setLoadState('loading');
      setLoadError(null);

      try {
        const loadedSettings = await getAppSettings();

        if (!isMounted) {
          return;
        }

        setSettings(loadedSettings);
        setFormValues(mapAppSettingsToFormValues(loadedSettings));
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
          error instanceof Error ? error.message : 'Unknown settings load error.',
        );
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  const errors = useMemo(
    () => (hasReviewed ? validateAppSettingsForm(formValues) : []),
    [formValues, hasReviewed],
  );

  return {
    errors,
    formValues,
    hasReviewed,
    loadError,
    loadState,
    reload: () => {
      setReloadToken(currentToken => currentToken + 1);
    },
    save: async () => {
      setHasReviewed(true);
      setSaveState('idle');
      setSaveFeedback(null);

      if (validateAppSettingsForm(formValues).length > 0) {
        setSaveState('error');
        setSaveFeedback('Review the highlighted fields before saving.');
        return null;
      }

      try {
        setSaveState('saving');
        const savedSettings = await saveAppSettings(formValues, settings);

        setSettings(savedSettings);
        setFormValues(mapAppSettingsToFormValues(savedSettings));
        setSaveState('success');
        setSaveFeedback('Settings updated.');

        return savedSettings;
      } catch (error) {
        if (error instanceof AppSettingsFormValidationError) {
          setSaveState('error');
          setSaveFeedback('Review the highlighted fields before saving.');
          return null;
        }

        setSaveState('error');
        setSaveFeedback(
          error instanceof Error ? error.message : 'Unknown settings save error.',
        );
        return null;
      }
    },
    saveFeedback,
    saveState,
    settings,
    setFieldValue: <Field extends keyof AppSettingsFormValues>(
      field: Field,
      value: AppSettingsFormValues[Field],
    ) => {
      setFormValues(currentValues => ({
        ...currentValues,
        [field]: value,
      }));
    },
  };
}
