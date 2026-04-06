import { getDatabase } from '../db';
import type { GymSearchSourcePersisted } from '../../domain/gymSearch/types';
import type { Gym } from '../../domain/models';
import {
  buildSearchKeywordsCompact,
  makeGymDedupeKey,
  normalizeCompact,
  normalizeSpacedLower,
  type LocalGymCandidate,
} from '../../utils/gymSearch';

const GYM_SELECT_COLUMNS = `
  id,
  name,
  latitude,
  longitude,
  radius_meters,
  timezone,
  is_primary,
  is_active,
  created_at,
  updated_at,
  external_place_id,
  search_source,
  formatted_address,
  address_line1,
  city,
  region,
  country_code,
  postal_code,
  brand_name,
  normalized_name,
  normalized_address,
  search_keywords,
  last_verified_at,
  name_compact,
  dedupe_key
`.replace(/\s+/g, ' ');

export type GymRow = {
  address_line1: string | null;
  brand_name: string | null;
  city: string | null;
  country_code: string | null;
  created_at: string;
  dedupe_key: string | null;
  external_place_id: string | null;
  formatted_address: string | null;
  id: string;
  is_active: number;
  is_primary: number;
  last_verified_at: string | null;
  latitude: number;
  longitude: number;
  name: string;
  name_compact: string | null;
  normalized_address: string | null;
  normalized_name: string | null;
  postal_code: string | null;
  radius_meters: number;
  region: string | null;
  search_keywords: string | null;
  search_source: string | null;
  timezone: string;
  updated_at: string;
};

export interface GymWriteInput {
  addressLine1?: string | null;
  brandName?: string | null;
  city?: string | null;
  countryCode?: string | null;
  externalPlaceId?: string | null;
  formattedAddress?: string | null;
  isActive?: boolean;
  isPrimary?: boolean;
  lastVerifiedAt?: string | null;
  latitude: number;
  longitude: number;
  name: string;
  postalCode?: string | null;
  radiusMeters: number;
  region?: string | null;
  searchSource?: GymSearchSourcePersisted | null;
  timezone: string;
}

function createGymId() {
  return `gym_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function deriveGymMetadata(input: GymWriteInput) {
  const name = input.name.trim();
  const searchSource = input.searchSource ?? 'manual';
  const nameCompact = normalizeCompact(name);
  const normalizedName = normalizeSpacedLower(name);
  const normalizedAddress = normalizeSpacedLower(
    input.formattedAddress ?? undefined,
  );
  const keywords = buildSearchKeywordsCompact({
    name,
    brandName: input.brandName,
    formattedAddress: input.formattedAddress,
    city: input.city,
    region: input.region,
    countryCode: input.countryCode,
  });
  const externalId = input.externalPlaceId?.trim() || null;
  const dedupeKey = externalId
    ? null
    : makeGymDedupeKey(name, input.latitude, input.longitude);

  return {
    address_line1: input.addressLine1?.trim() || null,
    brand_name: input.brandName?.trim() || null,
    city: input.city?.trim() || null,
    country_code: input.countryCode?.trim() || null,
    dedupe_key: dedupeKey,
    external_place_id: externalId,
    formatted_address: input.formattedAddress?.trim() || null,
    last_verified_at: input.lastVerifiedAt ?? null,
    name_compact: nameCompact || null,
    normalized_address: normalizedAddress,
    normalized_name: normalizedName,
    postal_code: input.postalCode?.trim() || null,
    region: input.region?.trim() || null,
    search_keywords: keywords || null,
    search_source: searchSource,
  };
}

function buildSelectGymByIdSql() {
  return `
    SELECT ${GYM_SELECT_COLUMNS}
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
    addressLine1: row.address_line1 ?? undefined,
    brandName: row.brand_name ?? undefined,
    city: row.city ?? undefined,
    countryCode: row.country_code ?? undefined,
    createdAt: row.created_at,
    dedupeKey: row.dedupe_key ?? undefined,
    externalPlaceId: row.external_place_id ?? undefined,
    formattedAddress: row.formatted_address ?? undefined,
    id: row.id,
    isActive: row.is_active === 1,
    isPrimary: row.is_primary === 1,
    lastVerifiedAt: row.last_verified_at ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    name: row.name,
    nameCompact: row.name_compact ?? undefined,
    normalizedAddress: row.normalized_address ?? undefined,
    normalizedName: row.normalized_name ?? undefined,
    postalCode: row.postal_code ?? undefined,
    radiusMeters: row.radius_meters,
    region: row.region ?? undefined,
    searchKeywords: row.search_keywords ?? undefined,
    searchSource: (row.search_source as Gym['searchSource']) ?? undefined,
    timezone: row.timezone,
    updatedAt: row.updated_at,
  };
}

export async function getPrimaryGym() {
  const db = getDatabase();
  const result = await db.executeAsync<GymRow>(
    `
      SELECT ${GYM_SELECT_COLUMNS}
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
      SELECT ${GYM_SELECT_COLUMNS}
      FROM gyms
      ORDER BY is_primary DESC, updated_at DESC
    `,
  );

  return result.rows._array.map(mapGymRowToModel);
}

/**
 * Broad SQL recall only — scoring and ordering happen in the use case.
 */
export async function searchGymsLocalCandidates(
  queryCompact: string,
  queryRawLower: string,
  limit: number,
): Promise<LocalGymCandidate[]> {
  const db = getDatabase();
  const result = await db.executeAsync<LocalGymCandidate>(
    `
      SELECT
        id,
        name,
        latitude,
        longitude,
        is_primary,
        updated_at,
        name_compact,
        brand_name,
        city,
        region,
        search_keywords,
        normalized_name,
        external_place_id,
        formatted_address,
        postal_code,
        country_code
      FROM gyms
      WHERE is_active = 1
        AND (
          COALESCE(name_compact, '') LIKE '%' || ? || '%'
          OR COALESCE(search_keywords, '') LIKE '%' || ? || '%'
          OR COALESCE(brand_name, '') LIKE '%' || ? || '%'
          OR COALESCE(city, '') LIKE '%' || ? || '%'
          OR COALESCE(region, '') LIKE '%' || ? || '%'
          OR LOWER(COALESCE(name, '')) LIKE '%' || ? || '%'
        )
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT ?
    `,
    [
      queryCompact,
      queryCompact,
      queryRawLower,
      queryRawLower,
      queryRawLower,
      queryRawLower,
      limit,
    ],
  );

  return result.rows._array;
}

export async function findGymByExternalPlaceId(
  placeId: string,
): Promise<Gym | null> {
  const db = getDatabase();
  const result = await db.executeAsync<GymRow>(
    `
      SELECT ${GYM_SELECT_COLUMNS}
      FROM gyms
      WHERE external_place_id = ?
      LIMIT 1
    `,
    [placeId],
  );
  const row = result.rows.item(0);
  return row ? mapGymRowToModel(row) : null;
}

export async function findGymByDedupeKey(key: string): Promise<Gym | null> {
  const db = getDatabase();
  const result = await db.executeAsync<GymRow>(
    `
      SELECT ${GYM_SELECT_COLUMNS}
      FROM gyms
      WHERE dedupe_key = ?
      LIMIT 1
    `,
    [key],
  );
  const row = result.rows.item(0);
  return row ? mapGymRowToModel(row) : null;
}

export async function createGym(input: GymWriteInput) {
  const db = getDatabase();
  const gymId = createGymId();
  const timestamp = new Date().toISOString();
  const isPrimary = input.isPrimary ?? true;
  const isActive = input.isActive ?? true;
  const meta = deriveGymMetadata(input);

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
          updated_at,
          external_place_id,
          search_source,
          formatted_address,
          address_line1,
          city,
          region,
          country_code,
          postal_code,
          brand_name,
          normalized_name,
          normalized_address,
          search_keywords,
          last_verified_at,
          name_compact,
          dedupe_key
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        gymId,
        input.name.trim(),
        input.latitude,
        input.longitude,
        input.radiusMeters,
        input.timezone,
        isPrimary ? 1 : 0,
        isActive ? 1 : 0,
        timestamp,
        timestamp,
        meta.external_place_id,
        meta.search_source,
        meta.formatted_address,
        meta.address_line1,
        meta.city,
        meta.region,
        meta.country_code,
        meta.postal_code,
        meta.brand_name,
        meta.normalized_name,
        meta.normalized_address,
        meta.search_keywords,
        meta.last_verified_at,
        meta.name_compact,
        meta.dedupe_key,
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
  const meta = deriveGymMetadata(input);

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
          updated_at = ?,
          external_place_id = ?,
          search_source = ?,
          formatted_address = ?,
          address_line1 = ?,
          city = ?,
          region = ?,
          country_code = ?,
          postal_code = ?,
          brand_name = ?,
          normalized_name = ?,
          normalized_address = ?,
          search_keywords = ?,
          last_verified_at = ?,
          name_compact = ?,
          dedupe_key = ?
        WHERE id = ?
      `,
      [
        input.name.trim(),
        input.latitude,
        input.longitude,
        input.radiusMeters,
        input.timezone,
        isPrimary ? 1 : 0,
        isActive ? 1 : 0,
        timestamp,
        meta.external_place_id,
        meta.search_source,
        meta.formatted_address,
        meta.address_line1,
        meta.city,
        meta.region,
        meta.country_code,
        meta.postal_code,
        meta.brand_name,
        meta.normalized_name,
        meta.normalized_address,
        meta.search_keywords,
        meta.last_verified_at,
        meta.name_compact,
        meta.dedupe_key,
        gymId,
      ],
    );

    if (result.rowsAffected === 0) {
      throw new Error(`Gym "${gymId}" could not be updated.`);
    }

    return selectGymById(tx.executeAsync, gymId);
  });
}
