export type GymSearchResultSource = 'internal_db' | 'google_places';

export type GymSearchResult = {
  source: GymSearchResultSource;
  placeId?: string | null;
  name: string;
  formattedAddress?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  brandName?: string | null;
  latitude: number;
  longitude: number;
  score?: number;
  gymId?: string;
};

export type GymSearchLogInput = {
  query: string;
  selectedGymId: string | null;
  source: 'local' | 'places';
};

export type SearchGymsConfig = {
  minQueryLength: number;
  placesCacheTtlHours: number;
  placesDailyLimit: number;
  /** Max remote results returned to the UI. */
  resultLimit: number;
  /**
   * When anchor lat/lng are set (e.g. primary gym), drop Places hits farther than this (km).
   * Prevents generic chain names from surfacing overseas locations.
   */
  placesMaxDistanceKmFromAnchor: number;
  /** Future hybrid/local phase knobs kept for compatibility with existing utilities/tests. */
  placesFallbackMinTopScore: number;
  localCandidateLimit: number;
  distanceWeightPerKm: number;
  maxDistanceKmForBoost: number;
  mergedResultLimit: number;
};

export type PlacesSearchQuota = {
  usageDate: string;
  limit: number;
  used: number;
  canUsePlacesFallback: boolean;
};

export type SearchGymsUseCaseResult = {
  results: GymSearchResult[];
  usedPlacesFallback: boolean;
  placesLimitReached: boolean;
  fromPlacesCache: boolean;
};

export type GymSearchSourcePersisted =
  | 'manual'
  | 'google_places'
  | 'internal_seed'
  | 'imported';

export type SaveGymFromSearchInput = {
  /** When the user picked an existing local row, update it instead of deduping. */
  existingGymId?: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timezone: string;
  isPrimary?: boolean;
  isActive?: boolean;
  externalPlaceId?: string | null;
  searchSource: GymSearchSourcePersisted;
  formattedAddress?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  brandName?: string | null;
  lastVerifiedAt?: string | null;
};

export type SaveGymSearchTelemetry = {
  query: string;
  source: 'local' | 'places';
};
