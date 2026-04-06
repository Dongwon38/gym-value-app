jest.mock('../../../data/repositories/GymSearchCacheRepository', () => ({
  getCachedPlacesSearchResults: jest.fn(),
  setCachedPlacesSearchResults: jest.fn(),
}));

jest.mock('../../../data/repositories/PlacesSearchUsageRepository', () => ({
  getPlacesSearchQuotaForDate: jest.fn(),
  incrementPlacesSearchUsageForDate: jest.fn(),
}));

const mockNearbySearch = jest.fn();

jest.mock('../../../data/services/placesSearchService', () => ({
  createPlacesSearchProvider: jest.fn(() => ({
    autocomplete: jest.fn(),
    getPlaceDetails: jest.fn(),
    nearbySearch: mockNearbySearch,
    textSearch: jest.fn(),
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
import { browseNearbyGyms } from './browseNearbyGyms';

describe('browseNearbyGyms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCachedPlacesSearchResults as jest.Mock).mockResolvedValue(null);
    (getPlacesSearchQuotaForDate as jest.Mock).mockResolvedValue({
      canUsePlacesFallback: true,
      limit: 5,
      used: 0,
      usageDate: '2026-04-05',
    });
    mockNearbySearch.mockResolvedValue([]);
  });

  it('uses a nearby cache key that includes anchor and radius', async () => {
    await browseNearbyGyms({
      latitude: 49.25,
      longitude: -123.1,
      radiusMeters: 5000,
    });

    expect(getCachedPlacesSearchResults).toHaveBeenCalledWith(
      expect.stringContaining('kind=nearby|anchor=49.25_-123.1|radius=5000'),
      expect.any(String),
    );
  });

  it('returns cached nearby results without incrementing usage', async () => {
    (getCachedPlacesSearchResults as jest.Mock).mockResolvedValue([
      {
        latitude: 49.25,
        longitude: -123.1,
        name: 'Cached Nearby Gym',
        source: 'google_places' as const,
      },
    ]);

    const out = await browseNearbyGyms({
      latitude: 49.25,
      longitude: -123.1,
      radiusMeters: 5000,
    });

    expect(out.fromPlacesCache).toBe(true);
    expect(out.results).toHaveLength(1);
    expect(mockNearbySearch).not.toHaveBeenCalled();
    expect(incrementPlacesSearchUsageForDate).not.toHaveBeenCalled();
  });

  it('does not call nearby search when quota is exceeded and cache misses', async () => {
    (getPlacesSearchQuotaForDate as jest.Mock).mockResolvedValue({
      canUsePlacesFallback: false,
      limit: 5,
      used: 5,
      usageDate: '2026-04-05',
    });

    const out = await browseNearbyGyms({
      latitude: 49.25,
      longitude: -123.1,
      radiusMeters: 5000,
    });

    expect(out.placesLimitReached).toBe(true);
    expect(mockNearbySearch).not.toHaveBeenCalled();
    expect(setCachedPlacesSearchResults).not.toHaveBeenCalled();
  });

  it('caches fresh nearby results and increments usage once', async () => {
    mockNearbySearch.mockResolvedValue([
      {
        latitude: 49.25,
        longitude: -123.1,
        name: 'Nearby Gym',
        source: 'google_places' as const,
      },
    ]);

    const out = await browseNearbyGyms({
      latitude: 49.25,
      longitude: -123.1,
      radiusMeters: 5000,
    });

    expect(out.usedPlacesFallback).toBe(true);
    expect(setCachedPlacesSearchResults).toHaveBeenCalledWith(
      expect.stringContaining('kind=nearby|anchor=49.25_-123.1|radius=5000'),
      expect.any(Array),
      expect.any(String),
      expect.any(String),
    );
    expect(incrementPlacesSearchUsageForDate).toHaveBeenCalledTimes(1);
  });
});
