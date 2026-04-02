import {
  defaultAppSettingsId,
  defaultAppSettingsSeed,
  ensureDefaultAppSettings,
} from './settingsBootstrap';

function createQueryResult(rowsAffected: number) {
  return {
    rowsAffected,
    results: [],
    rows: {
      _array: [],
      length: 0,
      item: () => undefined,
    },
  };
}

describe('ensureDefaultAppSettings', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('inserts the default BC settings row when missing', async () => {
    const executeAsync = jest.fn().mockResolvedValue(createQueryResult(1));

    const inserted = await ensureDefaultAppSettings({
      executeAsync,
    } as never);

    expect(inserted).toBe(true);
    expect(executeAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO app_settings'),
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
        expect.any(String),
        expect.any(String),
      ],
    );
  });

  it('leaves an existing settings row untouched', async () => {
    const executeAsync = jest.fn().mockResolvedValue(createQueryResult(0));

    const inserted = await ensureDefaultAppSettings({
      executeAsync,
    } as never);

    expect(inserted).toBe(false);
    expect(executeAsync).toHaveBeenCalledTimes(1);
  });
});
