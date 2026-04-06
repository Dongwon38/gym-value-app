import { getDatabase } from '../db';
import type { GymSearchResult } from '../../domain/gymSearch/types';

type CacheRow = {
  results_json: string;
  expires_at: string;
};

/**
 * Caches successful remote gym-search responses under an already-built query key.
 * Expired rows are ignored on read; optional cleanup keeps the table small.
 */
export async function getCachedPlacesSearchResults(
  queryKey: string,
  nowIso: string,
): Promise<GymSearchResult[] | null> {
  const db = getDatabase();
  const result = await db.executeAsync<CacheRow>(
    `
      SELECT results_json, expires_at
      FROM gym_search_cache
      WHERE query_key = ?
      LIMIT 1
    `,
    [queryKey],
  );
  const row = result.rows.item(0);
  if (!row || row.expires_at <= nowIso) {
    return null;
  }
  try {
    const parsed = JSON.parse(row.results_json) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed as GymSearchResult[];
  } catch {
    return null;
  }
}

export async function setCachedPlacesSearchResults(
  queryKey: string,
  results: GymSearchResult[],
  expiresAtIso: string,
  nowIso: string,
): Promise<void> {
  const db = getDatabase();
  await db.executeAsync(
    `
      INSERT INTO gym_search_cache (
        query_key,
        results_json,
        expires_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(query_key) DO UPDATE SET
        results_json = excluded.results_json,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at
    `,
    [queryKey, JSON.stringify(results), expiresAtIso, nowIso, nowIso],
  );
}

export async function deleteExpiredGymSearchCache(nowIso: string): Promise<void> {
  const db = getDatabase();
  await db.executeAsync(
    `
      DELETE FROM gym_search_cache
      WHERE expires_at <= ?
    `,
    [nowIso],
  );
}
