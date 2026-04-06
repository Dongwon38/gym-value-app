import { resolvePlacesSearchRegionCode } from './resolvePlacesSearchRegionCode';

describe('resolvePlacesSearchRegionCode', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prefers CA when system timezone is Canadian even if locale is en-US', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({
            calendar: 'gregory',
            locale: 'en-US',
            numberingSystem: 'latn',
            timeZone: 'America/Vancouver',
          }),
        }) as Intl.DateTimeFormat,
    );

    expect(resolvePlacesSearchRegionCode()).toBe('CA');
  });

  it('uses locale region when timezone is not a known Canadian zone', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({
            calendar: 'gregory',
            locale: 'en-CA',
            numberingSystem: 'latn',
            timeZone: 'Europe/London',
          }),
        }) as Intl.DateTimeFormat,
    );

    expect(resolvePlacesSearchRegionCode()).toBe('CA');
  });
});
