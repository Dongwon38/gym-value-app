import {
  PLACES_SEARCH_HTTP_URL,
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
  filterPlacesResultsByDistance,
  normalizeCompact,
  resolvePlacesSearchRegionCode,
  sortGymSearchResultsByDistance,
} from '../../../utils/gymSearch';

/**
 * Local-calendar date for daily Places quota (device timezone).
 */
export function getTodayLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function roundCoordForCacheKey(value: number, decimals: number): string {
  const p = 10 ** decimals;
  return String(Math.round(value * p) / p);
}

function buildAnchorCacheKey(
  anchorLat?: number,
  anchorLng?: number,
): string | null {
  if (
    anchorLat === undefined ||
    anchorLng === undefined ||
    !Number.isFinite(anchorLat) ||
    !Number.isFinite(anchorLng)
  ) {
    return null;
  }

  return `${roundCoordForCacheKey(anchorLat, 2)}_${roundCoordForCacheKey(anchorLng, 2)}`;
}

export function buildPlacesSearchCacheKey(input: {
  kind: 'text' | 'nearby';
  queryCompact?: string;
  anchorLat?: number;
  anchorLng?: number;
  nearbyRadiusMeters?: number;
  locale?: string;
  regionCode?: string;
}): string {
  const parts = [`kind=${input.kind}`];
  if (input.queryCompact) {
    parts.push(`q=${input.queryCompact}`);
  }

  const anchorKey = buildAnchorCacheKey(input.anchorLat, input.anchorLng);
  if (anchorKey) {
    parts.push(`anchor=${anchorKey}`);
  }

  if (
    input.nearbyRadiusMeters !== undefined &&
    Number.isFinite(input.nearbyRadiusMeters)
  ) {
    parts.push(`radius=${input.nearbyRadiusMeters}`);
  }

  if (input.locale?.trim()) {
    parts.push(`locale=${input.locale.trim()}`);
  }

  if (input.regionCode?.trim()) {
    parts.push(`region=${input.regionCode.trim().toUpperCase()}`);
  }

  return parts.join('|');
}

function orderResultsByAnchorDistance<T extends { latitude: number; longitude: number }>(
  results: T[],
  anchorLat?: number,
  anchorLng?: number,
): T[] {
  if (
    anchorLat === undefined ||
    anchorLng === undefined ||
    !Number.isFinite(anchorLat) ||
    !Number.isFinite(anchorLng) ||
    results.length <= 1
  ) {
    return results;
  }

  return sortGymSearchResultsByDistance(results, anchorLat, anchorLng);
}

function resolveDeviceLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

export type SearchGymsParams = {
  query: string;
  userLatitude?: number;
  userLongitude?: number;
  config?: SearchGymsConfig;
  /** Overrides `config/places.ts` when you inject a proxy URL. */
  placesEndpointUrl?: string | null;
  getTodayLocalDate?: () => string;
  nowIso?: () => string;
};

/**
 * Online-first gym text search:
 * 1) Read cache keyed by query + anchor + locale/region.
 * 2) If cache misses, consult quota and call remote text search.
 * 3) Drop remote outliers outside the anchor distance cap.
 * 4) Never block manual entry or the rest of the setup flow on network failures.
 */
export async function searchGyms(
  params: SearchGymsParams,
): Promise<SearchGymsUseCaseResult> {
  const config = params.config ?? defaultSearchGymsConfig;
  const query = params.query.trim();
  const nowIso = params.nowIso?.() ?? new Date().toISOString();
  const getToday = params.getTodayLocalDate ?? getTodayLocalDateString;
  const anchorLat = params.userLatitude;
  const anchorLng = params.userLongitude;

  if (query.length < config.minQueryLength) {
    return {
      fromPlacesCache: false,
      placesLimitReached: false,
      results: [],
      usedPlacesFallback: false,
    };
  }

  const locale = resolveDeviceLocale();
  const regionCode = resolvePlacesSearchRegionCode();
  const queryCompact = normalizeCompact(query);
  const cacheKey = buildPlacesSearchCacheKey({
    anchorLat,
    anchorLng,
    kind: 'text',
    locale,
    queryCompact,
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
      const endpoint =
        params.placesEndpointUrl ?? PLACES_SEARCH_HTTP_URL ?? null;
      const provider = createPlacesSearchProvider({
        textSearchUrl: endpoint,
      });

      const placesRequestLimit = Math.max(config.resultLimit, 24);
      results = await provider.textSearch({
        latitude: anchorLat,
        limit: placesRequestLimit,
        locale,
        longitude: anchorLng,
        query,
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

  if (
    anchorLat !== undefined &&
    anchorLng !== undefined &&
    Number.isFinite(anchorLat) &&
    Number.isFinite(anchorLng) &&
    config.placesMaxDistanceKmFromAnchor > 0 &&
    results.length > 0
  ) {
    results = filterPlacesResultsByDistance(
      results,
      anchorLat,
      anchorLng,
      config.placesMaxDistanceKmFromAnchor,
    );
  }

  return {
    fromPlacesCache,
    placesLimitReached,
    results: orderResultsByAnchorDistance(
      results.slice(0, config.resultLimit),
      anchorLat,
      anchorLng,
    ),
    usedPlacesFallback: results.length > 0,
  };
}
