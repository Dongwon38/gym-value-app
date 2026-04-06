import {
  PLACES_AUTOCOMPLETE_HTTP_URL,
} from '../../../config/places';
import {
  type GymSearchSuggestion,
} from '../../../domain/gymSearch';
import { createPlacesSearchProvider } from '../../../data/services/placesSearchService';
import { resolvePlacesSearchRegionCode } from '../../../utils/gymSearch';

function resolveDeviceLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

export type AutocompleteGymsParams = {
  query: string;
  sessionToken: string;
  userLatitude?: number;
  userLongitude?: number;
};

export async function autocompleteGyms(
  params: AutocompleteGymsParams,
): Promise<GymSearchSuggestion[]> {
  const query = params.query.trim();
  if (query.length < 2) {
    return [];
  }

  const provider = createPlacesSearchProvider({
    autocompleteUrl: PLACES_AUTOCOMPLETE_HTTP_URL,
  });

  return provider.autocomplete({
    latitude: params.userLatitude,
    limit: 8,
    locale: resolveDeviceLocale(),
    longitude: params.userLongitude,
    query,
    regionCode: resolvePlacesSearchRegionCode(),
    sessionToken: params.sessionToken,
  });
}
