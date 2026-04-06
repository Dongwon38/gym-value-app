jest.mock('../db', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../db';
import { createGym, listGyms, updateGym } from './GymRepository';
import type { GymRow } from './GymRepository';

function createRow(overrides: Partial<GymRow> = {}): GymRow {
  return {
    address_line1: null,
    brand_name: null,
    city: null,
    country_code: null,
    created_at: '2026-04-02T10:00:00.000Z',
    dedupe_key: null,
    external_place_id: null,
    formatted_address: null,
    id: 'gym_1',
    is_active: 1,
    is_primary: 1,
    last_verified_at: null,
    latitude: 49.2827,
    longitude: -123.1207,
    name: 'Downtown Gym',
    name_compact: null,
    normalized_address: null,
    normalized_name: null,
    postal_code: null,
    radius_meters: 150,
    region: null,
    search_keywords: null,
    search_source: 'manual',
    timezone: 'America/Vancouver',
    updated_at: '2026-04-02T10:00:00.000Z',
    ...overrides,
  };
}

function createRowsResult(row?: Record<string, unknown>) {
  const rows = row ? [row] : [];

  return {
    rows: {
      _array: rows,
      item: (index: number) => rows[index],
      length: rows.length,
    },
  };
}

describe('GymRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a primary gym and clears previous primary rows first', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(createRowsResult(createRow()));
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const savedGym = await createGym({
      latitude: 49.2827,
      longitude: -123.1207,
      name: 'Downtown Gym',
      radiusMeters: 150,
      timezone: 'America/Vancouver',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE gyms'),
      [expect.any(String)],
    );
    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO gyms'),
      expect.arrayContaining([
        expect.stringMatching(/^gym_/),
        'Downtown Gym',
        49.2827,
        -123.1207,
        150,
        'America/Vancouver',
        1,
        1,
      ]),
    );
    expect(savedGym.name).toBe('Downtown Gym');
    expect(savedGym.isPrimary).toBe(true);
  });

  it('updates an existing gym and preserves the single-primary rule', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce(createRowsResult(createRow({ name: 'Westside Gym' })));
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const savedGym = await updateGym('gym_1', {
      latitude: 49.3,
      longitude: -123.1,
      name: 'Westside Gym',
      radiusMeters: 180,
      timezone: 'America/Vancouver',
    });

    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE gyms'),
      [expect.any(String), 'gym_1'],
    );
    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('SET'),
      expect.arrayContaining([
        'Westside Gym',
        49.3,
        -123.1,
        180,
        'America/Vancouver',
        1,
        1,
        expect.any(String),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'gym_1',
      ]),
    );
    expect(savedGym.name).toBe('Westside Gym');
  });

  it('lists gyms in primary-first order', async () => {
    (getDatabase as jest.Mock).mockReturnValue({
      executeAsync: jest.fn().mockResolvedValue({
        rows: {
          _array: [createRow(), createRow({ id: 'gym_2', is_primary: 0 })],
          item: () => undefined,
          length: 2,
        },
      }),
    });

    const gyms = await listGyms();

    expect(gyms).toHaveLength(2);
    expect(gyms[0]?.isPrimary).toBe(true);
    expect(gyms[1]?.id).toBe('gym_2');
  });
});
