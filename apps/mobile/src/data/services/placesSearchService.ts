import type {
  GymPlaceDetails,
  GymSearchAutocompleteInput,
  GymSearchDetailsInput,
  GymSearchNearbyInput,
  GymSearchProvider,
  GymSearchProviderEndpoints,
  GymSearchResult,
  GymSearchSuggestion,
  GymSearchTextSearchInput,
} from '../../domain/gymSearch';
import type { GymSearchResultSource } from '../../domain/gymSearch/types';

async function postJson(
  endpointUrl: string | null | undefined,
  body: unknown,
): Promise<unknown> {
  const url = endpointUrl?.trim();
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseRemoteRow(
  raw: unknown,
  source: GymSearchResultSource = 'google_places',
): GymSearchResult | null {
  if (!isRecord(raw)) {
    return null;
  }
  const name = typeof raw.name === 'string' ? raw.name : null;
  const lat = toNumber(raw.latitude);
  const lng = toNumber(raw.longitude);
  if (!name || lat === null || lng === null) {
    return null;
  }

  return {
    source,
    placeId: typeof raw.placeId === 'string' ? raw.placeId : null,
    name,
    formattedAddress:
      typeof raw.formattedAddress === 'string' ? raw.formattedAddress : null,
    addressLine1:
      typeof raw.addressLine1 === 'string' ? raw.addressLine1 : null,
    city: typeof raw.city === 'string' ? raw.city : null,
    region: typeof raw.region === 'string' ? raw.region : null,
    countryCode: typeof raw.countryCode === 'string' ? raw.countryCode : null,
    postalCode: typeof raw.postalCode === 'string' ? raw.postalCode : null,
    brandName: typeof raw.brandName === 'string' ? raw.brandName : null,
    latitude: lat,
    longitude: lng,
  };
}

function parseSuggestion(raw: unknown): GymSearchSuggestion | null {
  if (!isRecord(raw)) {
    return null;
  }

  const placeId =
    typeof raw.placeId === 'string'
      ? raw.placeId
      : typeof raw.id === 'string'
        ? raw.id
        : null;
  const mainText =
    typeof raw.mainText === 'string'
      ? raw.mainText
      : typeof raw.name === 'string'
        ? raw.name
        : null;

  if (!placeId || !mainText) {
    return null;
  }

  return {
    mainText,
    placeId,
    secondaryText:
      typeof raw.secondaryText === 'string'
        ? raw.secondaryText
        : typeof raw.formattedAddress === 'string'
          ? raw.formattedAddress
          : null,
  };
}

function parseDetails(raw: unknown): GymPlaceDetails | null {
  if (!isRecord(raw)) {
    return null;
  }

  const placeId =
    typeof raw.placeId === 'string'
      ? raw.placeId
      : typeof raw.id === 'string'
        ? raw.id
        : null;
  const name = typeof raw.name === 'string' ? raw.name : null;
  const lat = toNumber(raw.latitude);
  const lng = toNumber(raw.longitude);

  if (!placeId || !name || lat === null || lng === null) {
    return null;
  }

  return {
    addressLine1:
      typeof raw.addressLine1 === 'string' ? raw.addressLine1 : null,
    brandName: typeof raw.brandName === 'string' ? raw.brandName : null,
    city: typeof raw.city === 'string' ? raw.city : null,
    countryCode: typeof raw.countryCode === 'string' ? raw.countryCode : null,
    formattedAddress:
      typeof raw.formattedAddress === 'string' ? raw.formattedAddress : null,
    latitude: lat,
    longitude: lng,
    name,
    placeId,
    postalCode: typeof raw.postalCode === 'string' ? raw.postalCode : null,
    region: typeof raw.region === 'string' ? raw.region : null,
  };
}

/**
 * Calls a backend that returns `GymSearchResult`-shaped JSON. Returns [] when
 * the URL is unset or the request fails so the app never breaks search UX.
 *
 * Proxies should use `latitude` / `longitude` (when set) for Places API
 * location bias or circle restriction so generic queries stay regional.
 * `regionCode` is an ISO 3166-1 alpha-2 hint when coordinates are absent.
 */
export async function fetchPlacesGymResults(
  params: GymSearchTextSearchInput,
  endpointUrl: string | null | undefined,
): Promise<GymSearchResult[]> {
  const data = await postJson(endpointUrl, params);
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(entry => parseRemoteRow(entry, 'places_text'))
    .filter((row): row is GymSearchResult => row !== null);
}

async function fetchPlacesAutocompleteSuggestions(
  params: GymSearchAutocompleteInput,
  endpointUrl: string | null | undefined,
): Promise<GymSearchSuggestion[]> {
  const data = await postJson(endpointUrl, params);
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(entry => parseSuggestion(entry))
    .filter((row): row is GymSearchSuggestion => row !== null);
}

async function fetchPlaceDetails(
  params: GymSearchDetailsInput,
  endpointUrl: string | null | undefined,
): Promise<GymPlaceDetails | null> {
  const data = await postJson(endpointUrl, params);
  return parseDetails(data);
}

async function unsupportedNearby(
  _input: GymSearchNearbyInput,
): Promise<GymSearchResult[]> {
  return [];
}

async function unsupportedDetails(
  _input: GymSearchDetailsInput,
): Promise<GymPlaceDetails | null> {
  return null;
}

export function createPlacesSearchProvider(
  endpoints: GymSearchProviderEndpoints,
): GymSearchProvider {
  return {
    async autocomplete(input) {
      return fetchPlacesAutocompleteSuggestions(
        input,
        endpoints.autocompleteUrl ?? null,
      );
    },
    async textSearch(input) {
      return fetchPlacesGymResults(input, endpoints.textSearchUrl ?? null);
    },
    async nearbySearch(input) {
      if (!endpoints.nearbyUrl?.trim()) {
        return unsupportedNearby(input);
      }

      const data = await postJson(endpoints.nearbyUrl, input);
      if (!Array.isArray(data)) {
        return [];
      }

      return data
        .map(entry => parseRemoteRow(entry, 'places_nearby'))
        .filter((row): row is GymSearchResult => row !== null);
    },
    async getPlaceDetails(input) {
      if (!endpoints.detailsUrl?.trim()) {
        return unsupportedDetails(input);
      }
      return fetchPlaceDetails(input, endpoints.detailsUrl);
    },
  };
}
