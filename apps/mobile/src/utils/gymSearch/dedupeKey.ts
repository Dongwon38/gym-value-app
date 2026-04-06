import { normalizeCompact } from './normalizeCompact';

function roundCoord(value: number, decimals: number): number {
  const p = 10 ** decimals;
  return Math.round(value * p) / p;
}

/**
 * When `external_place_id` is absent, match/update by name+rounded coordinates
 * so "same gym, same spot" does not create a second row.
 */
export function makeGymDedupeKey(
  name: string,
  latitude: number,
  longitude: number,
): string {
  const nc = normalizeCompact(name);
  const lat = roundCoord(latitude, 5);
  const lng = roundCoord(longitude, 5);
  return `${nc}@${lat},${lng}`;
}
