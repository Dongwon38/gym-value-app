import type { GymSearchResult } from '../../domain/gymSearch/types';
import { makeGymDedupeKey } from './dedupeKey';

/**
 * Prefer local rows first, then append Places rows that are not already represented
 * by place id or name+coordinates dedupe key.
 */
export function mergeSearchResults(
  locals: GymSearchResult[],
  places: GymSearchResult[],
  limit: number,
): GymSearchResult[] {
  const seenPlaceIds = new Set<string>();
  const seenDedupeKeys = new Set<string>();
  const out: GymSearchResult[] = [];

  function rememberDedupeKey(result: GymSearchResult) {
    if (result.placeId) {
      seenPlaceIds.add(result.placeId);
      return;
    }
    seenDedupeKeys.add(
      makeGymDedupeKey(result.name, result.latitude, result.longitude),
    );
  }

  function isDuplicatePlacesRow(result: GymSearchResult): boolean {
    if (result.placeId && seenPlaceIds.has(result.placeId)) {
      return true;
    }
    if (!result.placeId) {
      const key = makeGymDedupeKey(
        result.name,
        result.latitude,
        result.longitude,
      );
      if (seenDedupeKeys.has(key)) {
        return true;
      }
    }
    return false;
  }

  for (const local of locals) {
    rememberDedupeKey(local);
    out.push(local);
    if (out.length >= limit) {
      return out;
    }
  }

  for (const place of places) {
    if (isDuplicatePlacesRow(place)) {
      continue;
    }
    rememberDedupeKey(place);
    out.push(place);
    if (out.length >= limit) {
      break;
    }
  }

  return out;
}
