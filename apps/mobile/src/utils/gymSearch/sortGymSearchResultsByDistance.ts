import type { GymSearchResult } from '../../domain/gymSearch/types';
import { haversineKm } from './haversineKm';

export function sortGymSearchResultsByDistance(
  results: GymSearchResult[],
  anchorLat: number,
  anchorLng: number,
): GymSearchResult[] {
  if (results.length <= 1) {
    return results;
  }

  return [...results].sort((a, b) => {
    const da = haversineKm(anchorLat, anchorLng, a.latitude, a.longitude);
    const db = haversineKm(anchorLat, anchorLng, b.latitude, b.longitude);
    return da - db;
  });
}
