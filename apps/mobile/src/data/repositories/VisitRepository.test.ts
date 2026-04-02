jest.mock('../db', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../db';
import { listVisits } from './VisitRepository';

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
