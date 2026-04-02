export const homePrimaryMetrics = ['cost_per_visit'] as const;
export type HomePrimaryMetric = (typeof homePrimaryMetrics)[number];

export interface AppSettings {
  id: string;
  currency: string;
  locale: string;
  regionPreset: string | null;
  defaultGstRate: number;
  defaultPstRate: number;
  homePrimaryMetric: HomePrimaryMetric;
  checkinSuggestionsEnabled: boolean;
  checkoutSuggestionsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AppSettingsDefaults = Pick<
  AppSettings,
  | 'currency'
  | 'locale'
  | 'regionPreset'
  | 'defaultGstRate'
  | 'defaultPstRate'
  | 'homePrimaryMetric'
  | 'checkinSuggestionsEnabled'
  | 'checkoutSuggestionsEnabled'
>;
