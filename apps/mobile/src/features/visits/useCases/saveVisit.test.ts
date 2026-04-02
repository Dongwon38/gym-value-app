jest.mock('../../../data/repositories', () => ({
  createVisit: jest.fn(),
  updateVisit: jest.fn(),
}));

import { emptyVisitFormValues } from '../../../domain/forms';
import { createVisit, updateVisit } from '../../../data/repositories';
import {
  deriveCompletedVisitDurationMinutes,
  saveVisit,
  VisitFormValidationError,
} from './saveVisit';

describe('saveVisit', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('derives duration from startedAt and endedAt', () => {
    expect(
      deriveCompletedVisitDurationMinutes({
        date: '2026-04-02',
        endedAt: '11:15',
        startedAt: '10:00',
      }),
    ).toBe(75);
  });

  it('creates a completed visit from valid form values', async () => {
    (createVisit as jest.Mock).mockResolvedValue({ id: 'visit_1', status: 'completed' });

    await saveVisit(
      {
        ...emptyVisitFormValues,
        date: '2026-04-02',
        endedAt: '11:15',
        notes: 'Upper body',
        startedAt: '10:00',
      },
      { gymId: 'gym_1' },
    );

    expect(createVisit).toHaveBeenCalledWith({
      durationMinutes: 75,
      endedAt: '2026-04-02T18:15:00.000Z',
      gymId: 'gym_1',
      notes: 'Upper body',
      startedAt: '2026-04-02T17:00:00.000Z',
      status: 'completed',
    });
  });

  it('updates an existing visit when an id is provided', async () => {
    (updateVisit as jest.Mock).mockResolvedValue({ id: 'visit_1', status: 'completed' });

    await saveVisit(
      {
        ...emptyVisitFormValues,
        date: '2026-04-02',
        endedAt: '11:00',
        startedAt: '10:00',
      },
      {
        existingVisit: { id: 'visit_1' },
        gymId: 'gym_1',
      },
    );

    expect(updateVisit).toHaveBeenCalledWith(
      'visit_1',
      expect.objectContaining({
        durationMinutes: 60,
        status: 'completed',
      }),
    );
  });

  it('throws a validation error when required fields are missing', async () => {
    await expect(
      saveVisit(
        {
          ...emptyVisitFormValues,
          date: '',
          endedAt: '',
          startedAt: '',
        },
        { gymId: 'gym_1' },
      ),
    ).rejects.toBeInstanceOf(VisitFormValidationError);
  });
});
