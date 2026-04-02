import { defaultAppSettingsId, defaultAppSettingsValues } from '../../../domain/constants';
import {
  buildDashboardStats,
  resolveDashboardRange,
  type DashboardDateRange,
} from '../../../domain/calculations';
import type {
  AppSettings,
  DashboardRangeType,
  DashboardStats,
  Gym,
} from '../../../domain/models';
import {
  getPrimaryGym,
  getSettings,
  listFeeItems,
  listVisits,
} from '../../../data/repositories';

export interface HomeDashboardSnapshot {
  activeFeeItemCount: number;
  dashboardStats: DashboardStats;
  primaryGym: Gym | null;
  range: DashboardDateRange;
  settings: AppSettings;
  totalSavedVisits: number;
}

function createFallbackAppSettings(): AppSettings {
  return {
    checkinSuggestionsEnabled: defaultAppSettingsValues.checkinSuggestionsEnabled,
    checkoutSuggestionsEnabled: defaultAppSettingsValues.checkoutSuggestionsEnabled,
    createdAt: '',
    currency: defaultAppSettingsValues.currency,
    defaultGstRate: defaultAppSettingsValues.defaultGstRate,
    defaultPstRate: defaultAppSettingsValues.defaultPstRate,
    homePrimaryMetric: defaultAppSettingsValues.homePrimaryMetric,
    id: defaultAppSettingsId,
    locale: defaultAppSettingsValues.locale,
    regionPreset: defaultAppSettingsValues.regionPreset,
    updatedAt: '',
  };
}

export async function getHomeDashboardSnapshot(
  rangeType: DashboardRangeType = 'current_year',
  now = new Date(),
): Promise<HomeDashboardSnapshot> {
  const [feeItems, primaryGym, settings, visits] = await Promise.all([
    listFeeItems(),
    getPrimaryGym(),
    getSettings(),
    listVisits(),
  ]);
  const resolvedSettings = settings ?? createFallbackAppSettings();
  const range = resolveDashboardRange(rangeType, feeItems, visits, now);

  return {
    activeFeeItemCount: feeItems.filter(feeItem => feeItem.isActive).length,
    dashboardStats: buildDashboardStats({
      appSettings: resolvedSettings,
      feeItems,
      range,
      visits,
    }),
    primaryGym,
    range,
    settings: resolvedSettings,
    totalSavedVisits: visits.length,
  };
}
