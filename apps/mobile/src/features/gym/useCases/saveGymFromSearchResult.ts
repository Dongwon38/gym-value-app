import type {
  SaveGymFromSearchInput,
  SaveGymSearchTelemetry,
} from '../../../domain/gymSearch';
import type { Gym } from '../../../domain/models';
import { appendGymSearchLog } from '../../../data/repositories/GymSearchLogRepository';
import type { GymWriteInput } from '../../../data/repositories/GymRepository';
import {
  createGym,
  findGymByDedupeKey,
  findGymByExternalPlaceId,
  updateGym,
} from '../../../data/repositories/GymRepository';
import { makeGymDedupeKey } from '../../../utils/gymSearch';

function toWriteInput(input: SaveGymFromSearchInput): GymWriteInput {
  return {
    addressLine1: input.addressLine1,
    brandName: input.brandName,
    city: input.city,
    countryCode: input.countryCode,
    externalPlaceId: input.externalPlaceId,
    formattedAddress: input.formattedAddress,
    isActive: input.isActive ?? true,
    isPrimary: input.isPrimary ?? true,
    lastVerifiedAt: input.lastVerifiedAt,
    latitude: input.latitude,
    longitude: input.longitude,
    name: input.name,
    postalCode: input.postalCode,
    radiusMeters: input.radiusMeters,
    region: input.region,
    searchSource: input.searchSource,
    timezone: input.timezone,
  };
}

/**
 * Persists a gym from search or manual confirm. Dedupes by Google place id first,
 * then by compact name + rounded coordinates. Reuses `existingGymId` when the user
 * picked a local corpus row.
 */
export async function saveGymFromSearchResult(
  input: SaveGymFromSearchInput,
  telemetry?: SaveGymSearchTelemetry | null,
): Promise<Gym> {
  const write = toWriteInput(input);
  let gym: Gym;

  if (input.existingGymId) {
    gym = await updateGym(input.existingGymId, write);
  } else if (input.externalPlaceId?.trim()) {
    const placeId = input.externalPlaceId.trim();
    const byPlace = await findGymByExternalPlaceId(placeId);
    gym = byPlace
      ? await updateGym(byPlace.id, write)
      : await createGym(write);
  } else {
    const dedupeKey = makeGymDedupeKey(
      input.name,
      input.latitude,
      input.longitude,
    );
    const byDedupe = await findGymByDedupeKey(dedupeKey);
    gym = byDedupe
      ? await updateGym(byDedupe.id, write)
      : await createGym(write);
  }

  if (telemetry) {
    await appendGymSearchLog({
      query: telemetry.query,
      selectedGymId: gym.id,
      source: telemetry.source,
    });
  }

  return gym;
}
