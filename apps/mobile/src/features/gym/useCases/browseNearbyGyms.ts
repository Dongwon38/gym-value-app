import {
  PLACES_NEARBY_HTTP_URL,
  PLACES_SEARCH_QUOTA_ENABLED,
} from '../../../config/places';
import {
  defaultSearchGymsConfig,
  type SearchGymsConfig,
  type SearchGymsUseCaseResult,
} from '../../../domain/gymSearch';
import {
  getCachedPlacesSearchResults,
  setCachedPlacesSearchResults,
} from '../../../data/repositories/GymSearchCacheRepository';
import {
  getPlacesSearchQuotaForDate,
  incrementPlacesSearchUsageForDate,
} from '../../../data/repositories/PlacesSearchUsageRepository';
import { createPlacesSearchProvider } from '../../../data/services/placesSearchService';
import {
  buildPlacesSearchCacheKey,
  getTodayLocalDateString,
} from './searchGyms';
import { resolvePlacesSearchRegionCode } from '../../../utils/gymSearch';

function resolveDeviceLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

export type BrowseNearbyGymsParams = {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  config?: SearchGymsConfig;
  placesEndpointUrl?: string | null;
  getTodayLocalDate?: () => string;
  nowIso?: () => string;
};

export async function browseNearbyGyms(
  params: BrowseNearbyGymsParams,
): Promise<SearchGymsUseCaseResult> {
  const config = params.config ?? defaultSearchGymsConfig;
  const nowIso = params.nowIso?.() ?? new Date().toISOString();
  const getToday = params.getTodayLocalDate ?? getTodayLocalDateString;
  const locale = resolveDeviceLocale();
  const regionCode = resolvePlacesSearchRegionCode();
  const radiusMeters = params.radiusMeters ?? 5000;
  const cacheKey = buildPlacesSearchCacheKey({
    anchorLat: params.latitude,
    anchorLng: params.longitude,
    kind: 'nearby',
    locale,
    nearbyRadiusMeters: radiusMeters,
    regionCode,
  });

  let placesLimitReached = false;
  let fromPlacesCache = false;
  let results = await getCachedPlacesSearchResults(cacheKey, nowIso);

  if (results && results.length > 0) {
    fromPlacesCache = true;
  } else {
    results = [];

    let canFetchPlaces = true;
    if (PLACES_SEARCH_QUOTA_ENABLED) {
      const quota = await getPlacesSearchQuotaForDate(
        getToday(),
        config.placesDailyLimit,
      );
      canFetchPlaces = quota.canUsePlacesFallback;
      if (!canFetchPlaces) {
        placesLimitReached = true;
      }
    }

    if (canFetchPlaces) {
      const endpoint = params.placesEndpointUrl ?? PLACES_NEARBY_HTTP_URL ?? null;
      const provider = createPlacesSearchProvider({
        nearbyUrl: endpoint,
      });

      results = await provider.nearbySearch({
        latitude: params.latitude,
        limit: Math.max(config.resultLimit, 24),
        locale,
        longitude: params.longitude,
        radiusMeters,
        regionCode,
      });

      if (results.length > 0) {
        const expiresAt = new Date(
          Date.now() + config.placesCacheTtlHours * 3600000,
        ).toISOString();
        await setCachedPlacesSearchResults(cacheKey, results, expiresAt, nowIso);
        if (PLACES_SEARCH_QUOTA_ENABLED) {
          await incrementPlacesSearchUsageForDate(getToday(), nowIso);
        }
      }
    }
  }

  return {
    fromPlacesCache,
    placesLimitReached,
    results: results.slice(0, config.resultLimit),
    usedPlacesFallback: results.length > 0,
  };
}
