import type { SearchGymsConfig } from './types';

/** Current active search path is remote-first; local tuning stays only for future hybrid work. */
export const defaultSearchGymsConfig: SearchGymsConfig = {
  minQueryLength: 2,
  placesCacheTtlHours: 24,
  placesDailyLimit: 5,
  resultLimit: 12,
  /** ~Greater Vancouver + nearby; tune per market. */
  placesMaxDistanceKmFromAnchor: 280,
  placesFallbackMinTopScore: 72,
  localCandidateLimit: 200,
  distanceWeightPerKm: 2.5,
  maxDistanceKmForBoost: 25,
  mergedResultLimit: 12,
};
