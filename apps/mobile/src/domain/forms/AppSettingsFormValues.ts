import { defaultAppSettingsValues } from '../constants';

export interface AppSettingsFormValues {
  checkinSuggestionsEnabled: boolean;
  checkoutSuggestionsEnabled: boolean;
  currency: string;
  defaultGstRate: string;
  defaultPstRate: string;
  locale: string;
}

export const emptyAppSettingsFormValues: AppSettingsFormValues = {
  checkinSuggestionsEnabled: defaultAppSettingsValues.checkinSuggestionsEnabled,
  checkoutSuggestionsEnabled: defaultAppSettingsValues.checkoutSuggestionsEnabled,
  currency: defaultAppSettingsValues.currency,
  defaultGstRate: String(defaultAppSettingsValues.defaultGstRate),
  defaultPstRate: String(defaultAppSettingsValues.defaultPstRate),
  locale: defaultAppSettingsValues.locale,
};
