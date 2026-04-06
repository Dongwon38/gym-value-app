import type { GymSearchResult } from './types';

export type GymSearchSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText?: string | null;
};

export type GymPlaceDetails = {
  placeId: string;
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
};

export type GymSearchTextSearchInput = {
  query: string;
  locale?: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
  regionCode?: string;
};

export type GymSearchAutocompleteInput = {
  query: string;
  sessionToken: string;
  locale?: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
  regionCode?: string;
};

export type GymSearchNearbyInput = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  locale?: string;
  limit?: number;
  regionCode?: string;
};

export type GymSearchDetailsInput = {
  placeId: string;
  locale?: string;
  regionCode?: string;
};

export type GymSearchProvider = {
  autocomplete(
    input: GymSearchAutocompleteInput,
  ): Promise<GymSearchSuggestion[]>;
  textSearch(input: GymSearchTextSearchInput): Promise<GymSearchResult[]>;
  nearbySearch(input: GymSearchNearbyInput): Promise<GymSearchResult[]>;
  getPlaceDetails(input: GymSearchDetailsInput): Promise<GymPlaceDetails | null>;
};

export type GymSearchProviderEndpoints = {
  textSearchUrl?: string | null;
  autocompleteUrl?: string | null;
  nearbyUrl?: string | null;
  detailsUrl?: string | null;
};
