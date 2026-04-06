import {
  PLACES_PLACE_DETAILS_HTTP_URL,
} from '../../../config/places';
import {
  type GymPlaceDetails,
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

export async function loadGymPlaceDetails(
  placeId: string,
): Promise<GymPlaceDetails | null> {
  const id = placeId.trim();
  if (!id) {
    return null;
  }

  const provider = createPlacesSearchProvider({
    detailsUrl: PLACES_PLACE_DETAILS_HTTP_URL,
  });

  return provider.getPlaceDetails({
    locale: resolveDeviceLocale(),
    placeId: id,
    regionCode: resolvePlacesSearchRegionCode(),
  });
}
