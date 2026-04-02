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

export interface VisitWriteInput {
  confidence?: Visit['confidence'];
  durationMinutes: number | null;
  endedAt?: string | null;
  gymId: string;
  notes?: string | null;
  source?: Visit['source'];
  startedAt: string;
  status: Visit['status'];
}

function createVisitId() {
  return `visit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildSelectVisitByIdSql() {
  return `
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
    WHERE id = ?
    LIMIT 1
  `;
}

async function selectVisitById(
  executeAsync: <Row extends Record<string, unknown>>(
    query: string,
    params?: Array<string | number | null>,
  ) => Promise<{
    rows: {
      item: (index: number) => Row | undefined;
    };
  }>,
  visitId: string,
) {
  const result = await executeAsync<VisitRow>(buildSelectVisitByIdSql(), [visitId]);
  const row = result.rows.item(0);

  if (!row) {
    throw new Error(`Visit "${visitId}" could not be loaded after write.`);
  }

  return mapVisitRowToModel(row);
}

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

export async function createVisit(input: VisitWriteInput) {
  const db = getDatabase();
  const visitId = createVisitId();
  const timestamp = new Date().toISOString();

  return db.transaction(async tx => {
    await tx.executeAsync(
      `
        INSERT INTO visits (
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        visitId,
        input.gymId,
        input.startedAt,
        input.endedAt ?? null,
        input.durationMinutes,
        input.status,
        input.source ?? 'manual',
        input.confidence ?? 'high',
        input.notes ?? null,
        timestamp,
        timestamp,
      ],
    );

    return selectVisitById(tx.executeAsync, visitId);
  });
}

export async function updateVisit(visitId: string, input: VisitWriteInput) {
  const db = getDatabase();
  const timestamp = new Date().toISOString();

  return db.transaction(async tx => {
    const result = await tx.executeAsync(
      `
        UPDATE visits
        SET
          gym_id = ?,
          started_at = ?,
          ended_at = ?,
          duration_minutes = ?,
          status = ?,
          source = ?,
          confidence = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        input.gymId,
        input.startedAt,
        input.endedAt ?? null,
        input.durationMinutes,
        input.status,
        input.source ?? 'manual',
        input.confidence ?? 'high',
        input.notes ?? null,
        timestamp,
        visitId,
      ],
    );

    if (result.rowsAffected === 0) {
      throw new Error(`Visit "${visitId}" could not be updated.`);
    }

    return selectVisitById(tx.executeAsync, visitId);
  });
}
