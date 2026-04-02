import { emptyAppSettingsFormValues, type AppSettingsFormValues } from '../../../domain/forms';
import type { AppSettings } from '../../../domain/models';
import { getSettings } from '../../../data/repositories';

export async function getAppSettings() {
  return getSettings();
}

export function mapAppSettingsToFormValues(
  settings: AppSettings | null,
): AppSettingsFormValues {
  if (!settings) {
    return emptyAppSettingsFormValues;
  }

  return {
    currency: settings.currency,
    defaultGstRate: String(settings.defaultGstRate),
    defaultPstRate: String(settings.defaultPstRate),
    locale: settings.locale,
  };
}
