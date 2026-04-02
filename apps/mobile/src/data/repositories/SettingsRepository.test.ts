jest.mock('../db', () => ({
  getDatabase: jest.fn(),
}));

import { defaultAppSettingsId } from '../../domain/constants';
import { getDatabase } from '../db';
import {
  getSettings,
  upsertSettings,
} from './SettingsRepository';

function createAppSettingsRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    checkin_suggestions_enabled: 1,
    checkout_suggestions_enabled: 1,
    created_at: '2026-04-02T10:00:00.000Z',
    currency: 'CAD',
    default_gst_rate: 0.05,
    default_pst_rate: 0.07,
    home_primary_metric: 'cost_per_visit',
    id: defaultAppSettingsId,
    locale: 'en-CA',
    region_preset: 'BC_CA',
    updated_at: '2026-04-02T10:00:00.000Z',
    ...overrides,
  };
}

describe('SettingsRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads the default app settings row', async () => {
    const executeAsync = jest.fn().mockResolvedValue({
      rows: {
        item: () => createAppSettingsRow(),
      },
    });

    (getDatabase as jest.Mock).mockReturnValue({ executeAsync });

    const settings = await getSettings();

    expect(executeAsync).toHaveBeenCalledWith(
      expect.stringContaining('FROM app_settings'),
      [defaultAppSettingsId],
    );
    expect(settings).toMatchObject({
      checkinSuggestionsEnabled: true,
      checkoutSuggestionsEnabled: true,
      currency: 'CAD',
      defaultGstRate: 0.05,
      defaultPstRate: 0.07,
      locale: 'en-CA',
      regionPreset: 'BC_CA',
    });
  });

  it('upserts the default settings row in place', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: {
          item: () =>
            createAppSettingsRow({
              currency: 'USD',
              default_gst_rate: 0,
              default_pst_rate: 0.08,
              locale: 'en-US',
              updated_at: '2026-04-03T10:00:00.000Z',
            }),
        },
      });
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const savedSettings = await upsertSettings({
      checkinSuggestionsEnabled: true,
      checkoutSuggestionsEnabled: true,
      currency: 'USD',
      defaultGstRate: 0,
      defaultPstRate: 0.08,
      homePrimaryMetric: 'cost_per_visit',
      locale: 'en-US',
      regionPreset: 'BC_CA',
    });

    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO app_settings'),
      [
        defaultAppSettingsId,
        'USD',
        'en-US',
        'BC_CA',
        0,
        0.08,
        'cost_per_visit',
        1,
        1,
        expect.any(String),
        expect.any(String),
      ],
    );
    expect(savedSettings).toMatchObject({
      currency: 'USD',
      defaultGstRate: 0,
      defaultPstRate: 0.08,
      locale: 'en-US',
    });
  });
});
