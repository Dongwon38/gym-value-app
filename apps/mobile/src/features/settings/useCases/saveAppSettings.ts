import { defaultAppSettingsId, defaultAppSettingsValues } from '../../../domain/constants';
import type { AppSettingsFormValues } from '../../../domain/forms';
import type { AppSettings } from '../../../domain/models';
import { upsertSettings } from '../../../data/repositories';
import { parseNumericInput } from '../../../utils/validation';

type AppSettingsValidationIssue = {
  field: keyof AppSettingsFormValues;
  message: string;
};

export class AppSettingsFormValidationError extends Error {
  issues: AppSettingsValidationIssue[];

  constructor(issues: AppSettingsValidationIssue[]) {
    super('App settings form validation failed.');
    this.issues = issues;
  }
}

export function validateAppSettingsForm(values: AppSettingsFormValues) {
  const issues: AppSettingsValidationIssue[] = [];
  const defaultGstRate = parseNumericInput(values.defaultGstRate);
  const defaultPstRate = parseNumericInput(values.defaultPstRate);

  if (values.currency.trim().length === 0) {
    issues.push({
      field: 'currency',
      message: 'Enter a currency code such as CAD.',
    });
  }

  if (values.locale.trim().length === 0) {
    issues.push({
      field: 'locale',
      message: 'Enter a locale such as en-CA.',
    });
  }

  if (defaultGstRate === null || defaultGstRate < 0) {
    issues.push({
      field: 'defaultGstRate',
      message: 'Enter a GST rate that is 0 or greater.',
    });
  }

  if (defaultPstRate === null || defaultPstRate < 0) {
    issues.push({
      field: 'defaultPstRate',
      message: 'Enter a PST rate that is 0 or greater.',
    });
  }

  return issues;
}

export async function saveAppSettings(
  values: AppSettingsFormValues,
  currentSettings: AppSettings | null,
) {
  const issues = validateAppSettingsForm(values);

  if (issues.length > 0) {
    throw new AppSettingsFormValidationError(issues);
  }

  const defaultGstRate = parseNumericInput(values.defaultGstRate);
  const defaultPstRate = parseNumericInput(values.defaultPstRate);

  if (defaultGstRate === null || defaultPstRate === null) {
    throw new Error('App settings rates could not be parsed after validation.');
  }

  return upsertSettings({
    checkinSuggestionsEnabled: values.checkinSuggestionsEnabled,
    checkoutSuggestionsEnabled: values.checkoutSuggestionsEnabled,
    currency: values.currency.trim(),
    defaultGstRate,
    defaultPstRate,
    homePrimaryMetric:
      currentSettings?.homePrimaryMetric ??
      defaultAppSettingsValues.homePrimaryMetric,
    id: currentSettings?.id ?? defaultAppSettingsId,
    locale: values.locale.trim(),
    regionPreset:
      currentSettings?.regionPreset ?? defaultAppSettingsValues.regionPreset,
  });
}
