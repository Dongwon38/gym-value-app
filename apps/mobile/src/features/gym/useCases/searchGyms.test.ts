jest.mock('../../../data/repositories/GymSearchCacheRepository', () => ({
  getCachedPlacesSearchResults: jest.fn(),
  setCachedPlacesSearchResults: jest.fn(),
}));

jest.mock('../../../data/repositories/PlacesSearchUsageRepository', () => ({
  getPlacesSearchQuotaForDate: jest.fn(),
  incrementPlacesSearchUsageForDate: jest.fn(),
}));

const mockTextSearch = jest.fn();

jest.mock('../../../data/services/placesSearchService', () => ({
  createPlacesSearchProvider: jest.fn(() => ({
    autocomplete: jest.fn(),
    getPlaceDetails: jest.fn(),
    nearbySearch: jest.fn(),
    textSearch: mockTextSearch,
  })),
}));

jest.mock('../../../config/places', () => ({
  ...jest.requireActual<typeof import('../../../config/places')>(
    '../../../config/places',
  ),
  PLACES_SEARCH_QUOTA_ENABLED: true,
}));

import {
  getCachedPlacesSearchResults,
  setCachedPlacesSearchResults,
} from '../../../data/repositories/GymSearchCacheRepository';
import {
  getPlacesSearchQuotaForDate,
  incrementPlacesSearchUsageForDate,
} from '../../../data/repositories/PlacesSearchUsageRepository';
import { createPlacesSearchProvider } from '../../../data/services/placesSearchService';
import { defaultSearchGymsConfig } from '../../../domain/gymSearch';
import { searchGyms } from './searchGyms';

describe('searchGyms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTextSearch.mockResolvedValue([]);
    (getCachedPlacesSearchResults as jest.Mock).mockResolvedValue(null);
    (getPlacesSearchQuotaForDate as jest.Mock).mockResolvedValue({
      canUsePlacesFallback: true,
      limit: 5,
      used: 0,
      usageDate: '2026-04-04',
    });
  });

  it('returns empty when query is too short', async () => {
    const out = await searchGyms({
      config: { ...defaultSearchGymsConfig, minQueryLength: 3 },
      query: 'a',
    });

    expect(out.results).toEqual([]);
    expect(getCachedPlacesSearchResults).not.toHaveBeenCalled();
    expect(createPlacesSearchProvider).not.toHaveBeenCalled();
  });

  it('uses cache without incrementing usage', async () => {
    (getCachedPlacesSearchResults as jest.Mock).mockResolvedValue([
      {
        latitude: 1,
        longitude: 2,
        name: 'Cached',
        source: 'google_places' as const,
      },
    ]);

    const out = await searchGyms({
      query: 'anything',
    });

    expect(out.fromPlacesCache).toBe(true);
    expect(out.usedPlacesFallback).toBe(true);
    expect(createPlacesSearchProvider).not.toHaveBeenCalled();
    expect(incrementPlacesSearchUsageForDate).not.toHaveBeenCalled();
  });

  it('uses an anchor-aware text cache key', async () => {
    await searchGyms({
      query: 'GoodLife',
      userLatitude: 49.25,
      userLongitude: -123.1,
    });

    expect(getCachedPlacesSearchResults).toHaveBeenCalledWith(
      expect.stringContaining('kind=text|q=goodlife'),
      expect.any(String),
    );
    expect(getCachedPlacesSearchResults).toHaveBeenCalledWith(
      expect.stringContaining('anchor=49.25_-123.1'),
      expect.any(String),
    );
  });

  it('drops remote hits outside the anchor radius', async () => {
    mockTextSearch.mockResolvedValue([
      {
        latitude: 49.2,
        longitude: -123.0,
        name: 'Near Gym',
        source: 'google_places' as const,
      },
      {
        latitude: 43.54,
        longitude: -96.73,
        name: 'Far Gym',
        source: 'google_places' as const,
      },
    ]);

    const out = await searchGyms({
      config: {
        ...defaultSearchGymsConfig,
        placesMaxDistanceKmFromAnchor: 280,
      },
      query: 'goodlife',
      userLatitude: 49.25,
      userLongitude: -123.1,
    });

    expect(out.results.map(r => r.name)).toEqual(['Near Gym']);
    expect(mockTextSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 49.25,
        limit: 24,
        longitude: -123.1,
        query: 'goodlife',
      }),
    );
  });

  it('does not call remote search when quota is exceeded and cache misses', async () => {
    (getPlacesSearchQuotaForDate as jest.Mock).mockResolvedValue({
      canUsePlacesFallback: false,
      limit: 5,
      used: 5,
      usageDate: '2026-04-04',
    });

    const out = await searchGyms({
      query: 'findme',
    });

    expect(out.placesLimitReached).toBe(true);
    expect(mockTextSearch).not.toHaveBeenCalled();
    expect(setCachedPlacesSearchResults).not.toHaveBeenCalled();
  });

  it('caches fresh remote results and increments usage once', async () => {
    mockTextSearch.mockResolvedValue([
      {
        latitude: 49.28,
        longitude: -123.12,
        name: 'GoodLife Downtown',
        source: 'google_places' as const,
      },
    ]);

    const out = await searchGyms({
      query: 'goodlife',
      userLatitude: 49.28,
      userLongitude: -123.12,
    });

    expect(out.fromPlacesCache).toBe(false);
    expect(out.usedPlacesFallback).toBe(true);
    expect(setCachedPlacesSearchResults).toHaveBeenCalledWith(
      expect.stringContaining('kind=text|q=goodlife'),
      expect.any(Array),
      expect.any(String),
      expect.any(String),
    );
    expect(incrementPlacesSearchUsageForDate).toHaveBeenCalledTimes(1);
  });
});
