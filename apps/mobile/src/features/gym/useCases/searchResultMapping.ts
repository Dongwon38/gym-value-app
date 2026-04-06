import type {
  GymPlaceDetails,
  GymSearchResult,
  GymSearchResultSource,
  GymSearchSourcePersisted,
  SaveGymFromSearchInput,
  SaveGymSearchTelemetry,
} from '../../../domain/gymSearch';

export function mapSearchResultSourceToPersistedSource(
  source: GymSearchResultSource,
): GymSearchSourcePersisted {
  if (
    source === 'google_places' ||
    source === 'places_text' ||
    source === 'places_nearby'
  ) {
    return 'google_places';
  }

  return 'internal_seed';
}

export function mapSearchResultSourceToTelemetrySource(
  source: GymSearchResultSource,
): SaveGymSearchTelemetry['source'] {
  return source === 'internal_db' ? 'local' : 'places';
}

export function buildSaveInputFromGymSearchResult(
  result: GymSearchResult,
  radiusMeters: number,
  timezone: string,
): SaveGymFromSearchInput {
  return {
    brandName: result.brandName ?? null,
    city: result.city ?? null,
    countryCode: result.countryCode ?? null,
    existingGymId: result.gymId,
    externalPlaceId: result.placeId ?? null,
    formattedAddress: result.formattedAddress ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
    name: result.name,
    postalCode: result.postalCode ?? null,
    radiusMeters,
    region: result.region ?? null,
    searchSource: mapSearchResultSourceToPersistedSource(result.source),
    timezone,
  };
}

export function buildSearchResultFromPlaceDetails(
  details: GymPlaceDetails,
  source: Extract<GymSearchResultSource, 'places_text' | 'places_nearby' | 'google_places'> = 'places_text',
): GymSearchResult {
  return {
    addressLine1: details.addressLine1 ?? null,
    brandName: details.brandName ?? null,
    city: details.city ?? null,
    countryCode: details.countryCode ?? null,
    formattedAddress: details.formattedAddress ?? null,
    latitude: details.latitude,
    longitude: details.longitude,
    name: details.name,
    placeId: details.placeId,
    postalCode: details.postalCode ?? null,
    region: details.region ?? null,
    source,
  };
}
