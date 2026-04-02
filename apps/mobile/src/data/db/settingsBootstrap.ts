import type { NitroSQLiteConnection } from 'react-native-nitro-sqlite';

import {
  defaultAppSettingsId,
  defaultAppSettingsValues,
} from '../../domain/constants';

export { defaultAppSettingsId } from '../../domain/constants';

function logSettingsBootstrapInfo(message: string) {
  console.info(`[db:settings] ${message}`);
}

export const defaultAppSettingsSeed = {
  checkinSuggestionsEnabled: defaultAppSettingsValues.checkinSuggestionsEnabled
    ? 1
    : 0,
  checkoutSuggestionsEnabled: defaultAppSettingsValues.checkoutSuggestionsEnabled
    ? 1
    : 0,
  currency: defaultAppSettingsValues.currency,
  defaultGstRate: defaultAppSettingsValues.defaultGstRate,
  defaultPstRate: defaultAppSettingsValues.defaultPstRate,
  homePrimaryMetric: defaultAppSettingsValues.homePrimaryMetric,
  locale: defaultAppSettingsValues.locale,
  regionPreset: defaultAppSettingsValues.regionPreset,
} as const;

export async function ensureDefaultAppSettings(db: NitroSQLiteConnection) {
  const timestamp = new Date().toISOString();
  const result = await db.executeAsync(
    `
      INSERT INTO app_settings (
        id,
        currency,
        locale,
        region_preset,
        default_gst_rate,
        default_pst_rate,
        home_primary_metric,
        checkin_suggestions_enabled,
        checkout_suggestions_enabled,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `,
    [
      defaultAppSettingsId,
      defaultAppSettingsSeed.currency,
      defaultAppSettingsSeed.locale,
      defaultAppSettingsSeed.regionPreset,
      defaultAppSettingsSeed.defaultGstRate,
      defaultAppSettingsSeed.defaultPstRate,
      defaultAppSettingsSeed.homePrimaryMetric,
      defaultAppSettingsSeed.checkinSuggestionsEnabled,
      defaultAppSettingsSeed.checkoutSuggestionsEnabled,
      timestamp,
      timestamp,
    ],
  );

  if (result.rowsAffected > 0) {
    logSettingsBootstrapInfo(
      `Seeded default app settings row "${defaultAppSettingsId}".`,
    );
    return true;
  }

  logSettingsBootstrapInfo(
    `Default app settings row "${defaultAppSettingsId}" already exists.`,
  );
  return false;
}
