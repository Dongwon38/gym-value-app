import type { Visit } from '../../domain/models';
import { getDatabase } from '../db';

export type VisitRow = {
  confidence: Visit['confidence'];
  created_at: string;
  duration_minutes: number | null;
  ended_at: string | null;
  gym_id: string;
  id: string;
  notes: string | null;
  source: Visit['source'];
  started_at: string;
  status: Visit['status'];
  updated_at: string;
};

export function mapVisitRowToModel(row: VisitRow): Visit {
  return {
    confidence: row.confidence,
    createdAt: row.created_at,
    durationMinutes: row.duration_minutes,
    endedAt: row.ended_at,
    gymId: row.gym_id,
    id: row.id,
    notes: row.notes,
    source: row.source,
    startedAt: row.started_at,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function listVisits(options?: { includeCancelled?: boolean }) {
  const db = getDatabase();
  const includeCancelled = options?.includeCancelled ?? false;
  const result = await db.executeAsync<VisitRow>(
    `
      SELECT
        id,
        gym_id,
        started_at,
        ended_at,
        duration_minutes,
        status,
        source,
        confidence,
        notes,
        created_at,
        updated_at
      FROM visits
      ${includeCancelled ? '' : "WHERE status != 'cancelled'"}
      ORDER BY started_at DESC, created_at DESC
    `,
  );

  return result.rows._array.map(mapVisitRowToModel);
}
