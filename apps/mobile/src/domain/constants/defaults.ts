import type { AppSettingsDefaults, DashboardRangeType } from '../models';

export const defaultAppSettingsId = 'default';
export const defaultDashboardRangeType: DashboardRangeType = 'current_year';

export const defaultAppSettingsValues: AppSettingsDefaults = {
  checkinSuggestionsEnabled: true,
  checkoutSuggestionsEnabled: true,
  currency: 'CAD',
  defaultGstRate: 0.05,
  defaultPstRate: 0.07,
  homePrimaryMetric: 'cost_per_visit',
  locale: 'en-CA',
  regionPreset: 'BC_CA',
};
