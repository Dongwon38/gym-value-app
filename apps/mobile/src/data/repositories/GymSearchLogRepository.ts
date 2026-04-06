import { getDatabase } from '../db';
import type { GymSearchLogInput } from '../../domain/gymSearch/types';

function createLogId() {
  return `gsl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Append-only analytics for future ranking and autocomplete. */
export async function appendGymSearchLog(
  input: GymSearchLogInput,
  options?: { id?: string; nowIso?: string },
): Promise<void> {
  const db = getDatabase();
  const id = options?.id ?? createLogId();
  const nowIso = options?.nowIso ?? new Date().toISOString();

  await db.executeAsync(
    `
      INSERT INTO gym_search_logs (
        id,
        query,
        selected_gym_id,
        source,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [id, input.query, input.selectedGymId, input.source, nowIso],
  );
}
