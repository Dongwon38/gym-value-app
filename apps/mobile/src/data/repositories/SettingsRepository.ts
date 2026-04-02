import { defaultAppSettingsId } from '../../domain/constants';
import type { AppSettings } from '../../domain/models';
import { getDatabase } from '../db';

export type AppSettingsRow = {
  checkin_suggestions_enabled: number;
  checkout_suggestions_enabled: number;
  created_at: string;
  currency: string;
  default_gst_rate: number;
  default_pst_rate: number;
  home_primary_metric: AppSettings['homePrimaryMetric'];
  id: string;
  locale: string;
  region_preset: string | null;
  updated_at: string;
};

export interface AppSettingsWriteInput {
  checkinSuggestionsEnabled: boolean;
  checkoutSuggestionsEnabled: boolean;
  currency: string;
  defaultGstRate: number;
  defaultPstRate: number;
  homePrimaryMetric: AppSettings['homePrimaryMetric'];
  id?: string;
  locale: string;
  regionPreset: string | null;
}

function buildSelectSettingsByIdSql() {
  return `
    SELECT
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
    FROM app_settings
    WHERE id = ?
    LIMIT 1
  `;
}

async function selectSettingsById(
  executeAsync: <Row extends Record<string, unknown>>(
    query: string,
    params?: Array<string | number | null>,
  ) => Promise<{
    rows: {
      item: (index: number) => Row | undefined;
    };
  }>,
  settingsId: string,
) {
  const result = await executeAsync<AppSettingsRow>(buildSelectSettingsByIdSql(), [
    settingsId,
  ]);
  const row = result.rows.item(0);

  if (!row) {
    throw new Error(`App settings "${settingsId}" could not be loaded after write.`);
  }

  return mapAppSettingsRowToModel(row);
}

export function mapAppSettingsRowToModel(row: AppSettingsRow): AppSettings {
  return {
    checkinSuggestionsEnabled: row.checkin_suggestions_enabled === 1,
    checkoutSuggestionsEnabled: row.checkout_suggestions_enabled === 1,
    createdAt: row.created_at,
    currency: row.currency,
    defaultGstRate: row.default_gst_rate,
    defaultPstRate: row.default_pst_rate,
    homePrimaryMetric: row.home_primary_metric,
    id: row.id,
    locale: row.locale,
    regionPreset: row.region_preset,
    updatedAt: row.updated_at,
  };
}

export async function getSettings(settingsId = defaultAppSettingsId) {
  const db = getDatabase();
  const result = await db.executeAsync<AppSettingsRow>(buildSelectSettingsByIdSql(), [
    settingsId,
  ]);
  const row = result.rows.item(0);

  return row ? mapAppSettingsRowToModel(row) : null;
}

export async function upsertSettings(input: AppSettingsWriteInput) {
  const db = getDatabase();
  const settingsId = input.id ?? defaultAppSettingsId;
  const timestamp = new Date().toISOString();

  return db.transaction(async tx => {
    await tx.executeAsync(
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
        ON CONFLICT(id) DO UPDATE SET
          currency = excluded.currency,
          locale = excluded.locale,
          region_preset = excluded.region_preset,
          default_gst_rate = excluded.default_gst_rate,
          default_pst_rate = excluded.default_pst_rate,
          home_primary_metric = excluded.home_primary_metric,
          checkin_suggestions_enabled = excluded.checkin_suggestions_enabled,
          checkout_suggestions_enabled = excluded.checkout_suggestions_enabled,
          updated_at = excluded.updated_at
      `,
      [
        settingsId,
        input.currency,
        input.locale,
        input.regionPreset,
        input.defaultGstRate,
        input.defaultPstRate,
        input.homePrimaryMetric,
        input.checkinSuggestionsEnabled ? 1 : 0,
        input.checkoutSuggestionsEnabled ? 1 : 0,
        timestamp,
        timestamp,
      ],
    );

    return selectSettingsById(tx.executeAsync, settingsId);
  });
}
