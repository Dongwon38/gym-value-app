jest.mock('../../../data/repositories', () => ({
  upsertSettings: jest.fn(),
}));

import { upsertSettings } from '../../../data/repositories';
import {
  AppSettingsFormValidationError,
  saveAppSettings,
} from './saveAppSettings';

describe('saveAppSettings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('upserts edited currency, locale, and default tax rates', async () => {
    (upsertSettings as jest.Mock).mockResolvedValue({
      currency: 'USD',
      defaultGstRate: 0,
      defaultPstRate: 0.08,
      id: 'default',
      locale: 'en-US',
    });

    await saveAppSettings(
      {
        currency: 'USD',
        defaultGstRate: '0',
        defaultPstRate: '0.08',
        locale: 'en-US',
      },
      null,
    );

    expect(upsertSettings).toHaveBeenCalledWith({
      checkinSuggestionsEnabled: true,
      checkoutSuggestionsEnabled: true,
      currency: 'USD',
      defaultGstRate: 0,
      defaultPstRate: 0.08,
      homePrimaryMetric: 'cost_per_visit',
      id: 'default',
      locale: 'en-US',
      regionPreset: 'BC_CA',
    });
  });

  it('throws a validation error when required fields are missing', async () => {
    await expect(
      saveAppSettings(
        {
          currency: '',
          defaultGstRate: '',
          defaultPstRate: '0.07',
          locale: '',
        },
        null,
      ),
    ).rejects.toBeInstanceOf(AppSettingsFormValidationError);
  });
});
