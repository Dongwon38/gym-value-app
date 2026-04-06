import type { GymSearchResult } from '../../domain/gymSearch/types';
import { haversineKm } from './haversineKm';

/**
 * Drops Google Places rows farther than `maxKm` from the anchor (e.g. primary gym).
 * Local DB rows are not passed through this helper.
 */
export function filterPlacesResultsByDistance(
  results: GymSearchResult[],
  anchorLat: number,
  anchorLng: number,
  maxKm: number,
): GymSearchResult[] {
  if (!Number.isFinite(maxKm) || maxKm <= 0) {
    return results;
  }

  return results.filter(result => {
    const km = haversineKm(
      anchorLat,
      anchorLng,
      result.latitude,
      result.longitude,
    );
    return km <= maxKm;
  });
}
