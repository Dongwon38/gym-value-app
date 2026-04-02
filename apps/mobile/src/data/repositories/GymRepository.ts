import { getDatabase } from '../db';
import type { Gym } from '../../domain/models';

export type GymRow = {
  created_at: string;
  id: string;
  is_active: number;
  is_primary: number;
  latitude: number;
  longitude: number;
  name: string;
  radius_meters: number;
  timezone: string;
  updated_at: string;
};

export interface GymWriteInput {
  isActive?: boolean;
  isPrimary?: boolean;
  latitude: number;
  longitude: number;
  name: string;
  radiusMeters: number;
  timezone: string;
}

function createGymId() {
  return `gym_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildSelectGymByIdSql() {
  return `
    SELECT
      id,
      name,
      latitude,
      longitude,
      radius_meters,
      timezone,
      is_primary,
      is_active,
      created_at,
      updated_at
    FROM gyms
    WHERE id = ?
    LIMIT 1
  `;
}

async function selectGymById(
  executeAsync: <Row extends Record<string, unknown>>(
    query: string,
    params?: Array<string | number | null>,
  ) => Promise<{
    rows: {
      item: (index: number) => Row | undefined;
    };
  }>,
  gymId: string,
) {
  const result = await executeAsync<GymRow>(buildSelectGymByIdSql(), [gymId]);
  const row = result.rows.item(0);

  if (!row) {
    throw new Error(`Gym "${gymId}" could not be loaded after write.`);
  }

  return mapGymRowToModel(row);
}

async function clearOtherPrimaryGyms(
  executeAsync: (query: string, params?: Array<string | number | null>) => Promise<unknown>,
  timestamp: string,
  excludeGymId?: string,
) {
  if (excludeGymId) {
    await executeAsync(
      `
        UPDATE gyms
        SET is_primary = 0, updated_at = ?
        WHERE is_primary = 1 AND is_active = 1 AND id != ?
      `,
      [timestamp, excludeGymId],
    );
    return;
  }

  await executeAsync(
    `
      UPDATE gyms
      SET is_primary = 0, updated_at = ?
      WHERE is_primary = 1 AND is_active = 1
    `,
    [timestamp],
  );
}

export function mapGymRowToModel(row: GymRow): Gym {
  return {
    createdAt: row.created_at,
    id: row.id,
    isActive: row.is_active === 1,
    isPrimary: row.is_primary === 1,
    latitude: row.latitude,
    longitude: row.longitude,
    name: row.name,
    radiusMeters: row.radius_meters,
    timezone: row.timezone,
    updatedAt: row.updated_at,
  };
}

export async function getPrimaryGym() {
  const db = getDatabase();
  const result = await db.executeAsync<GymRow>(
    `
      SELECT
        id,
        name,
        latitude,
        longitude,
        radius_meters,
        timezone,
        is_primary,
        is_active,
        created_at,
        updated_at
      FROM gyms
      WHERE is_primary = 1 AND is_active = 1
      ORDER BY updated_at DESC
      LIMIT 1
    `,
  );

  const row = result.rows.item(0);

  if (!row) {
    return null;
  }

  return mapGymRowToModel(row);
}

export async function listGyms() {
  const db = getDatabase();
  const result = await db.executeAsync<GymRow>(
    `
      SELECT
        id,
        name,
        latitude,
        longitude,
        radius_meters,
        timezone,
        is_primary,
        is_active,
        created_at,
        updated_at
      FROM gyms
      ORDER BY is_primary DESC, updated_at DESC
    `,
  );

  return result.rows._array.map(mapGymRowToModel);
}

export async function createGym(input: GymWriteInput) {
  const db = getDatabase();
  const gymId = createGymId();
  const timestamp = new Date().toISOString();
  const isPrimary = input.isPrimary ?? true;
  const isActive = input.isActive ?? true;

  return db.transaction(async tx => {
    if (isPrimary && isActive) {
      await clearOtherPrimaryGyms(tx.executeAsync, timestamp);
    }

    await tx.executeAsync(
      `
        INSERT INTO gyms (
          id,
          name,
          latitude,
          longitude,
          radius_meters,
          timezone,
          is_primary,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        gymId,
        input.name,
        input.latitude,
        input.longitude,
        input.radiusMeters,
        input.timezone,
        isPrimary ? 1 : 0,
        isActive ? 1 : 0,
        timestamp,
        timestamp,
      ],
    );

    return selectGymById(tx.executeAsync, gymId);
  });
}

export async function updateGym(gymId: string, input: GymWriteInput) {
  const db = getDatabase();
  const timestamp = new Date().toISOString();
  const isPrimary = input.isPrimary ?? true;
  const isActive = input.isActive ?? true;

  return db.transaction(async tx => {
    if (isPrimary && isActive) {
      await clearOtherPrimaryGyms(tx.executeAsync, timestamp, gymId);
    }

    const result = await tx.executeAsync(
      `
        UPDATE gyms
        SET
          name = ?,
          latitude = ?,
          longitude = ?,
          radius_meters = ?,
          timezone = ?,
          is_primary = ?,
          is_active = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        input.name,
        input.latitude,
        input.longitude,
        input.radiusMeters,
        input.timezone,
        isPrimary ? 1 : 0,
        isActive ? 1 : 0,
        timestamp,
        gymId,
      ],
    );

    if (result.rowsAffected === 0) {
      throw new Error(`Gym "${gymId}" could not be updated.`);
    }

    return selectGymById(tx.executeAsync, gymId);
  });
}
