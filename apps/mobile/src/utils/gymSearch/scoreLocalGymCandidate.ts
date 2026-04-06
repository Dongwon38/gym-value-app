import type { SearchGymsConfig } from '../../domain/gymSearch/types';
import { haversineKm } from './haversineKm';
import { normalizeCompact } from './normalizeCompact';

export type LocalGymCandidate = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_primary: number;
  updated_at: string;
  name_compact?: string | null;
  brand_name?: string | null;
  city?: string | null;
  region?: string | null;
  search_keywords?: string | null;
  normalized_name?: string | null;
  country_code?: string | null;
  external_place_id?: string | null;
  formatted_address?: string | null;
  postal_code?: string | null;
};

const W_EXACT = 100;
const W_PREFIX = 85;
const W_CONTAINS = 55;
const W_BLOB_CONTAINS = 45;
const W_TOKEN = 18;
const W_BRAND_MATCH = 12;
const W_CITY_MATCH = 10;
const W_REGION_MATCH = 8;

function splitCompactTokens(compact: string): string[] {
  if (compact.length <= 3) {
    return compact ? [compact] : [];
  }

  const out: string[] = [];
  const re = /[\p{L}\p{N}]{3,}/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(compact)) !== null) {
    out.push(match[0]);
  }

  return out.length > 0 ? out : [compact];
}

export function scoreLocalGymCandidate(
  row: LocalGymCandidate,
  queryRawTrimmed: string,
  queryCompact: string,
  userLat: number | undefined,
  userLng: number | undefined,
  config: SearchGymsConfig,
): number {
  if (!queryCompact) {
    return 0;
  }

  const nameC =
    row.name_compact && row.name_compact.length > 0
      ? row.name_compact
      : normalizeCompact(row.name);
  const normName = row.normalized_name
    ? normalizeCompact(row.normalized_name)
    : nameC;
  const blob =
    normalizeCompact(
      [
        row.search_keywords,
        row.name,
        row.brand_name,
        row.city,
        row.region,
      ]
        .filter(Boolean)
        .join(' '),
    ) || nameC;

  let score = 0;

  if (nameC === queryCompact || normName === queryCompact) {
    score += W_EXACT;
  } else if (
    nameC.startsWith(queryCompact) ||
    normName.startsWith(queryCompact)
  ) {
    score += W_PREFIX;
  } else if (
    nameC.includes(queryCompact) ||
    normName.includes(queryCompact)
  ) {
    score += W_CONTAINS;
  } else if (blob.includes(queryCompact)) {
    score += W_BLOB_CONTAINS;
  }

  const tokens = splitCompactTokens(queryCompact);
  for (const token of tokens) {
    if (token.length >= 3 && blob.includes(token)) {
      score += W_TOKEN;
    }
  }

  const qLower = queryRawTrimmed.toLowerCase();
  if (row.brand_name && qLower.includes(row.brand_name.toLowerCase())) {
    score += W_BRAND_MATCH;
  }
  if (row.city && qLower.includes(row.city.toLowerCase())) {
    score += W_CITY_MATCH;
  }
  if (row.region && qLower.includes(row.region.toLowerCase())) {
    score += W_REGION_MATCH;
  }

  if (
    userLat !== undefined &&
    userLng !== undefined &&
    config.maxDistanceKmForBoost > 0
  ) {
    const distanceKm = haversineKm(
      userLat,
      userLng,
      row.latitude,
      row.longitude,
    );
    const boost =
      Math.max(0, config.maxDistanceKmForBoost - distanceKm) *
      config.distanceWeightPerKm;
    score += boost;
  }

  return score;
}

export function compareScoredLocalRows(
  a: { score: number; row: LocalGymCandidate },
  b: { score: number; row: LocalGymCandidate },
): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  if (b.row.is_primary !== a.row.is_primary) {
    return b.row.is_primary - a.row.is_primary;
  }
  return b.row.updated_at.localeCompare(a.row.updated_at);
}
