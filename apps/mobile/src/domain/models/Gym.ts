import type { GymSearchSourcePersisted } from '../gymSearch/types';

export interface Gym {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timezone: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  externalPlaceId?: string | null;
  searchSource?: GymSearchSourcePersisted | null;
  formattedAddress?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  brandName?: string | null;
  normalizedName?: string | null;
  normalizedAddress?: string | null;
  searchKeywords?: string | null;
  lastVerifiedAt?: string | null;
  nameCompact?: string | null;
  dedupeKey?: string | null;
}
