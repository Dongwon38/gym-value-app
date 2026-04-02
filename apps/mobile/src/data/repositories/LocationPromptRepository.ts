import type { LocationPrompt } from '../../domain/models';
import { getDatabase } from '../db';

export type LocationPromptRow = {
  created_at: string;
  dismissed_permanently: number;
  gym_id: string;
  id: string;
  occurred_at: string;
  related_visit_id: string | null;
  type: LocationPrompt['type'];
  was_accepted: number;
};

export interface LocationPromptWriteInput {
  dismissedPermanently?: boolean;
  gymId: string;
  occurredAt: string;
  relatedVisitId?: string | null;
  type: LocationPrompt['type'];
  wasAccepted?: boolean;
}

export interface ListLocationPromptOptions {
  gymId?: string;
  limit?: number;
  relatedVisitId?: string;
}

function createLocationPromptId() {
  return `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildSelectLocationPromptByIdSql() {
  return `
    SELECT
      id,
      gym_id,
      type,
      occurred_at,
      was_accepted,
      related_visit_id,
      dismissed_permanently,
      created_at
    FROM location_prompts
    WHERE id = ?
    LIMIT 1
  `;
}

function buildListLocationPromptsQuery(options: ListLocationPromptOptions = {}) {
  const conditions: string[] = [];
  const params: Array<string | number | null> = [];

  if (options.gymId) {
    conditions.push('gym_id = ?');
    params.push(options.gymId);
  }

  if (options.relatedVisitId) {
    conditions.push('related_visit_id = ?');
    params.push(options.relatedVisitId);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = options.limit ? 'LIMIT ?' : '';

  if (options.limit) {
    params.push(options.limit);
  }

  return {
    params,
    query: `
      SELECT
        id,
        gym_id,
        type,
        occurred_at,
        was_accepted,
        related_visit_id,
        dismissed_permanently,
        created_at
      FROM location_prompts
      ${whereClause}
      ORDER BY occurred_at DESC, created_at DESC
      ${limitClause}
    `,
  };
}

async function selectLocationPromptById(
  executeAsync: <Row extends Record<string, unknown>>(
    query: string,
    params?: Array<string | number | null>,
  ) => Promise<{
    rows: {
      item: (index: number) => Row | undefined;
    };
  }>,
  promptId: string,
) {
  const result = await executeAsync<LocationPromptRow>(
    buildSelectLocationPromptByIdSql(),
    [promptId],
  );
  const row = result.rows.item(0);

  return row ? mapLocationPromptRowToModel(row) : null;
}

export function mapLocationPromptRowToModel(
  row: LocationPromptRow,
): LocationPrompt {
  return {
    createdAt: row.created_at,
    dismissedPermanently: row.dismissed_permanently === 1,
    gymId: row.gym_id,
    id: row.id,
    occurredAt: row.occurred_at,
    relatedVisitId: row.related_visit_id,
    type: row.type,
    wasAccepted: row.was_accepted === 1,
  };
}

export async function getLocationPrompt(promptId: string) {
  const db = getDatabase();
  return selectLocationPromptById(db.executeAsync, promptId);
}

export async function getLatestLocationPrompt(options?: {
  gymId?: string;
  relatedVisitId?: string;
}) {
  const prompts = await listLocationPrompts({
    ...options,
    limit: 1,
  });

  return prompts[0] ?? null;
}

export async function listLocationPrompts(options?: ListLocationPromptOptions) {
  const db = getDatabase();
  const { params, query } = buildListLocationPromptsQuery(options);
  const result = await db.executeAsync<LocationPromptRow>(query, params);

  return result.rows._array.map(mapLocationPromptRowToModel);
}

export async function createLocationPrompt(input: LocationPromptWriteInput) {
  const db = getDatabase();
  const promptId = createLocationPromptId();
  const timestamp = new Date().toISOString();

  return db.transaction(async tx => {
    await tx.executeAsync(
      `
        INSERT INTO location_prompts (
          id,
          gym_id,
          type,
          occurred_at,
          was_accepted,
          related_visit_id,
          dismissed_permanently,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        promptId,
        input.gymId,
        input.type,
        input.occurredAt,
        input.wasAccepted ? 1 : 0,
        input.relatedVisitId ?? null,
        input.dismissedPermanently ? 1 : 0,
        timestamp,
      ],
    );

    const prompt = await selectLocationPromptById(tx.executeAsync, promptId);

    if (!prompt) {
      throw new Error(
        `Location prompt "${promptId}" could not be loaded after write.`,
      );
    }

    return prompt;
  });
}

export async function markLocationPromptAccepted(
  promptId: string,
  relatedVisitId: string | null,
) {
  const db = getDatabase();

  return db.transaction(async tx => {
    const result = await tx.executeAsync(
      `
        UPDATE location_prompts
        SET
          was_accepted = 1,
          related_visit_id = ?
        WHERE id = ?
      `,
      [relatedVisitId, promptId],
    );

    if (result.rowsAffected === 0) {
      throw new Error(
        `Location prompt "${promptId}" could not be marked accepted.`,
      );
    }

    const prompt = await selectLocationPromptById(tx.executeAsync, promptId);

    if (!prompt) {
      throw new Error(
        `Location prompt "${promptId}" could not be loaded after write.`,
      );
    }

    return prompt;
  });
}

export async function dismissLocationPrompt(promptId: string) {
  const db = getDatabase();

  return db.transaction(async tx => {
    const result = await tx.executeAsync(
      `
        UPDATE location_prompts
        SET dismissed_permanently = 1
        WHERE id = ?
      `,
      [promptId],
    );

    if (result.rowsAffected === 0) {
      throw new Error(`Location prompt "${promptId}" could not be dismissed.`);
    }

    const prompt = await selectLocationPromptById(tx.executeAsync, promptId);

    if (!prompt) {
      throw new Error(
        `Location prompt "${promptId}" could not be loaded after write.`,
      );
    }

    return prompt;
  });
}
