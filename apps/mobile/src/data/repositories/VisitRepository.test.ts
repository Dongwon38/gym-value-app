jest.mock('../db', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../db';
import { createVisit, listVisits, updateVisit } from './VisitRepository';

function createVisitRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    confidence: 'high',
    created_at: '2026-04-02T10:00:00.000Z',
    duration_minutes: 75,
    ended_at: '2026-04-02T11:15:00.000Z',
    gym_id: 'gym_1',
    id: 'visit_1',
    notes: 'Leg day',
    source: 'manual',
    started_at: '2026-04-02T10:00:00.000Z',
    status: 'completed',
    updated_at: '2026-04-02T11:15:00.000Z',
    ...overrides,
  };
}

describe('VisitRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a completed visit with derived duration data', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: {
          item: () => createVisitRow({ id: 'visit_3', duration_minutes: 45 }),
        },
      });
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const savedVisit = await createVisit({
      durationMinutes: 45,
      endedAt: '2026-04-03T11:45:00.000Z',
      gymId: 'gym_1',
      notes: 'Quick session',
      startedAt: '2026-04-03T11:00:00.000Z',
      status: 'completed',
    });

    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO visits'),
      expect.arrayContaining([
        expect.stringMatching(/^visit_/),
        'gym_1',
        '2026-04-03T11:00:00.000Z',
        '2026-04-03T11:45:00.000Z',
        45,
        'completed',
      ]),
    );
    expect(savedVisit.durationMinutes).toBe(45);
  });

  it('updates an existing completed visit', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({
        rows: {
          item: () => createVisitRow({ id: 'visit_1', notes: 'Updated note' }),
        },
      });
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const savedVisit = await updateVisit('visit_1', {
      durationMinutes: 90,
      endedAt: '2026-04-02T11:30:00.000Z',
      gymId: 'gym_1',
      notes: 'Updated note',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'completed',
    });

    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE visits'),
      [
        'gym_1',
        '2026-04-02T10:00:00.000Z',
        '2026-04-02T11:30:00.000Z',
        90,
        'completed',
        'manual',
        'high',
        'Updated note',
        expect.any(String),
        'visit_1',
      ],
    );
    expect(savedVisit.notes).toBe('Updated note');
  });

  it('lists visits newest-first and excludes cancelled rows by default', async () => {
    const executeAsync = jest.fn().mockResolvedValue({
      rows: {
        _array: [
          createVisitRow(),
          createVisitRow({
            ended_at: null,
            id: 'visit_2',
            started_at: '2026-04-01T08:00:00.000Z',
            status: 'active',
          }),
        ],
        item: () => undefined,
        length: 2,
      },
    });

    (getDatabase as jest.Mock).mockReturnValue({ executeAsync });

    const visits = await listVisits();

    expect(executeAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE status != 'cancelled'"),
    );
    expect(visits).toHaveLength(2);
    expect(visits[0]?.id).toBe('visit_1');
    expect(visits[1]?.status).toBe('active');
  });

  it('includes cancelled rows when explicitly requested', async () => {
    const executeAsync = jest.fn().mockResolvedValue({
      rows: {
        _array: [createVisitRow({ id: 'visit_3', status: 'cancelled' })],
        item: () => undefined,
        length: 1,
      },
    });

    (getDatabase as jest.Mock).mockReturnValue({ executeAsync });

    const visits = await listVisits({ includeCancelled: true });

    expect(executeAsync).toHaveBeenCalledWith(
      expect.not.stringContaining("WHERE status != 'cancelled'"),
    );
    expect(visits[0]?.status).toBe('cancelled');
  });
});
