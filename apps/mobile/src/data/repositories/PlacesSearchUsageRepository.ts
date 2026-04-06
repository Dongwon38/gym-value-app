import { getDatabase } from '../db';
import type { PlacesSearchQuota } from '../../domain/gymSearch/types';

type UsageRow = {
  places_search_count: number;
};

/**
 * Tracks **successful** Google Places network calls per calendar day (device local date).
 * Cache hits and local-only search do not use this table.
 */
export async function getPlacesSearchUsageForDate(usageDate: string): Promise<number> {
  const db = getDatabase();
  const result = await db.executeAsync<UsageRow>(
    `
      SELECT places_search_count
      FROM gym_place_search_usage
      WHERE usage_date = ?
      LIMIT 1
    `,
    [usageDate],
  );
  const row = result.rows.item(0);
  return row?.places_search_count ?? 0;
}

export async function incrementPlacesSearchUsageForDate(
  usageDate: string,
  nowIso: string,
): Promise<number> {
  const db = getDatabase();
  await db.executeAsync(
    `
      INSERT INTO gym_place_search_usage (
        usage_date,
        places_search_count,
        created_at,
        updated_at
      )
      VALUES (?, 1, ?, ?)
      ON CONFLICT(usage_date) DO UPDATE SET
        places_search_count = places_search_count + 1,
        updated_at = excluded.updated_at
    `,
    [usageDate, nowIso, nowIso],
  );
  return getPlacesSearchUsageForDate(usageDate);
}

export async function getPlacesSearchQuotaForDate(
  usageDate: string,
  limit: number,
): Promise<PlacesSearchQuota> {
  const used = await getPlacesSearchUsageForDate(usageDate);
  return {
    usageDate,
    limit,
    used,
    canUsePlacesFallback: used < limit,
  };
}
