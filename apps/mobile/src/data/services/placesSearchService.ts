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

function parseRemoteRow(raw: unknown): GymSearchResult | null {
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
    source: 'google_places',
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
  const url = endpointUrl?.trim();
  if (!url) {
    return [];
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map(entry => parseRemoteRow(entry))
      .filter((row): row is GymSearchResult => row !== null);
  } catch {
    return [];
  }
}

async function unsupportedAutocomplete(
  _input: GymSearchAutocompleteInput,
): Promise<GymSearchSuggestion[]> {
  return [];
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
    autocomplete: unsupportedAutocomplete,
    async textSearch(input) {
      return fetchPlacesGymResults(input, endpoints.textSearchUrl ?? null);
    },
    nearbySearch: unsupportedNearby,
    getPlaceDetails: unsupportedDetails,
  };
}
