import { defaultAppSettingsValues } from '../constants';

export interface AppSettingsFormValues {
  currency: string;
  defaultGstRate: string;
  defaultPstRate: string;
  locale: string;
}

export const emptyAppSettingsFormValues: AppSettingsFormValues = {
  currency: defaultAppSettingsValues.currency,
  defaultGstRate: String(defaultAppSettingsValues.defaultGstRate),
  defaultPstRate: String(defaultAppSettingsValues.defaultPstRate),
  locale: defaultAppSettingsValues.locale,
};
