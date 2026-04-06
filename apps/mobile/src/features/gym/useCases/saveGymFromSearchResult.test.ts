jest.mock('../../../data/repositories/GymSearchLogRepository', () => ({
  appendGymSearchLog: jest.fn(),
}));

jest.mock('../../../data/repositories/GymRepository', () => ({
  createGym: jest.fn(),
  findGymByDedupeKey: jest.fn(),
  findGymByExternalPlaceId: jest.fn(),
  updateGym: jest.fn(),
}));

import { appendGymSearchLog } from '../../../data/repositories/GymSearchLogRepository';
import {
  createGym,
  findGymByDedupeKey,
  findGymByExternalPlaceId,
  updateGym,
} from '../../../data/repositories/GymRepository';
import { saveGymFromSearchResult } from './saveGymFromSearchResult';

const saved = {
  createdAt: 't',
  id: 'gym_x',
  isActive: true,
  isPrimary: true,
  latitude: 1,
  longitude: 2,
  name: 'X',
  radiusMeters: 100,
  timezone: 'UTC',
  updatedAt: 't',
};

describe('saveGymFromSearchResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates when existingGymId is set', async () => {
    (updateGym as jest.Mock).mockResolvedValue(saved);

    await saveGymFromSearchResult({
      existingGymId: 'gym_x',
      latitude: 1,
      longitude: 2,
      name: 'X',
      radiusMeters: 100,
      searchSource: 'internal_seed',
      timezone: 'UTC',
    });

    expect(updateGym).toHaveBeenCalledWith('gym_x', expect.any(Object));
    expect(createGym).not.toHaveBeenCalled();
  });

  it('updates by external place id when present', async () => {
    (findGymByExternalPlaceId as jest.Mock).mockResolvedValue({ id: 'p1' });
    (updateGym as jest.Mock).mockResolvedValue(saved);

    await saveGymFromSearchResult({
      externalPlaceId: 'ChIJxxx',
      latitude: 1,
      longitude: 2,
      name: 'Chain Gym',
      radiusMeters: 100,
      searchSource: 'google_places',
      timezone: 'UTC',
    });

    expect(updateGym).toHaveBeenCalledWith('p1', expect.any(Object));
  });

  it('appends search log when telemetry is passed', async () => {
    (createGym as jest.Mock).mockResolvedValue(saved);
    (findGymByExternalPlaceId as jest.Mock).mockResolvedValue(null);
    (findGymByDedupeKey as jest.Mock).mockResolvedValue(null);

    await saveGymFromSearchResult(
      {
        latitude: 1,
        longitude: 2,
        name: 'New',
        radiusMeters: 100,
        searchSource: 'google_places',
        timezone: 'UTC',
      },
      { query: 'gym', source: 'places' },
    );

    expect(appendGymSearchLog).toHaveBeenCalledWith({
      query: 'gym',
      selectedGymId: 'gym_x',
      source: 'places',
    });
  });
});
