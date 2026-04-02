jest.mock('../../../data/db', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../../../data/db';
import { mapGymToFormValues, mapGymRowToModel, getPrimaryGym } from './primaryGym';

describe('primary gym read path', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('maps a SQLite gym row into the app model and form values', () => {
    const gym = mapGymRowToModel({
      created_at: '2026-04-01T10:00:00.000Z',
      id: 'gym_1',
      is_active: 1,
      is_primary: 1,
      latitude: 49.2827,
      longitude: -123.1207,
      name: 'Downtown Gym',
      radius_meters: 150,
      timezone: 'America/Vancouver',
      updated_at: '2026-04-02T10:00:00.000Z',
    });

    expect(gym).toEqual({
      createdAt: '2026-04-01T10:00:00.000Z',
      id: 'gym_1',
      isActive: true,
      isPrimary: true,
      latitude: 49.2827,
      longitude: -123.1207,
      name: 'Downtown Gym',
      radiusMeters: 150,
      timezone: 'America/Vancouver',
      updatedAt: '2026-04-02T10:00:00.000Z',
    });

    expect(mapGymToFormValues(gym)).toEqual({
      latitude: '49.2827',
      longitude: '-123.1207',
      name: 'Downtown Gym',
      radiusMeters: '150',
      timezone: 'America/Vancouver',
    });
  });

  it('returns null when there is no active primary gym row', async () => {
    const executeAsync = jest.fn().mockResolvedValue({
      rows: {
        _array: [],
        item: () => undefined,
        length: 0,
      },
    });

    (getDatabase as jest.Mock).mockReturnValue({ executeAsync });

    await expect(getPrimaryGym()).resolves.toBeNull();
  });

  it('queries and maps the active primary gym row', async () => {
    const row = {
      created_at: '2026-04-01T10:00:00.000Z',
      id: 'gym_1',
      is_active: 1,
      is_primary: 1,
      latitude: 49.2827,
      longitude: -123.1207,
      name: 'Downtown Gym',
      radius_meters: 150,
      timezone: 'America/Vancouver',
      updated_at: '2026-04-02T10:00:00.000Z',
    };
    const executeAsync = jest.fn().mockResolvedValue({
      rows: {
        _array: [row],
        item: (index: number) => (index === 0 ? row : undefined),
        length: 1,
      },
    });

    (getDatabase as jest.Mock).mockReturnValue({ executeAsync });

    await expect(getPrimaryGym()).resolves.toEqual({
      createdAt: row.created_at,
      id: row.id,
      isActive: true,
      isPrimary: true,
      latitude: row.latitude,
      longitude: row.longitude,
      name: row.name,
      radiusMeters: row.radius_meters,
      timezone: row.timezone,
      updatedAt: row.updated_at,
    });
    expect(executeAsync).toHaveBeenCalledWith(
      expect.stringContaining('FROM gyms'),
    );
  });
});
