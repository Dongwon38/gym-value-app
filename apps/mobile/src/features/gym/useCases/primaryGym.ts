export {
  getPrimaryGym,
  mapGymRowToModel,
} from '../../../data/repositories';
import { emptyGymFormValues, type GymFormValues } from '../../../domain/forms';
import type { Gym } from '../../../domain/models';
import { getDeviceIanaTimeZone } from '../../../utils/getDeviceIanaTimeZone';

export function mapGymToFormValues(gym: Gym | null): GymFormValues {
  if (!gym) {
    return {
      ...emptyGymFormValues,
      timezone: getDeviceIanaTimeZone(),
    };
  }

  return {
    latitude: String(gym.latitude),
    longitude: String(gym.longitude),
    name: gym.name,
    radiusMeters: String(gym.radiusMeters),
      timezone: gym.timezone,
  };
}
