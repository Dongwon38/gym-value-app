import {
  buildSaveInputFromGymSearchResult,
  mapSearchResultSourceToPersistedSource,
  mapSearchResultSourceToTelemetrySource,
} from './searchResultMapping';

describe('searchResultMapping', () => {
  it('maps remote runtime sources to persisted google_places', () => {
    expect(mapSearchResultSourceToPersistedSource('google_places')).toBe(
      'google_places',
    );
    expect(mapSearchResultSourceToPersistedSource('places_text')).toBe(
      'google_places',
    );
    expect(mapSearchResultSourceToPersistedSource('places_nearby')).toBe(
      'google_places',
    );
  });

  it('maps internal results to local telemetry and internal_seed persistence', () => {
    expect(mapSearchResultSourceToPersistedSource('internal_db')).toBe(
      'internal_seed',
    );
    expect(mapSearchResultSourceToTelemetrySource('internal_db')).toBe('local');
  });

  it('maps remote results to places telemetry and preserves save-ready fields', () => {
    const input = buildSaveInputFromGymSearchResult(
      {
        brandName: 'GoodLife',
        city: 'Burnaby',
        countryCode: 'CA',
        formattedAddress: '4560 Kingsway, Burnaby, BC',
        latitude: 49.225,
        longitude: -123.01,
        name: 'GoodLife Burnaby',
        placeId: 'place_123',
        postalCode: 'V5H',
        region: 'BC',
        source: 'places_nearby',
      },
      150,
      'America/Vancouver',
    );

    expect(input).toEqual(
      expect.objectContaining({
        externalPlaceId: 'place_123',
        latitude: 49.225,
        longitude: -123.01,
        radiusMeters: 150,
        searchSource: 'google_places',
        timezone: 'America/Vancouver',
      }),
    );
    expect(mapSearchResultSourceToTelemetrySource('places_nearby')).toBe(
      'places',
    );
  });
});
