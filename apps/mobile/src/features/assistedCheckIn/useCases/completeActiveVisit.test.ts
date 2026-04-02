jest.mock('../../../data/repositories', () => ({
  getActiveVisit: jest.fn(),
  getLocationPrompt: jest.fn(),
  markLocationPromptAccepted: jest.fn(),
  updateVisit: jest.fn(),
}));

import {
  getActiveVisit,
  getLocationPrompt,
  markLocationPromptAccepted,
  updateVisit,
} from '../../../data/repositories';
import {
  ActiveVisitNotFoundError,
  completeActiveVisit,
  deriveDurationMinutesFromIsoRange,
} from './completeActiveVisit';

describe('completeActiveVisit', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('derives duration from ISO timestamps', () => {
    expect(
      deriveDurationMinutesFromIsoRange(
        '2026-04-02T10:00:00.000Z',
        '2026-04-02T11:15:00.000Z',
      ),
    ).toBe(75);
  });

  it('completes the active visit from a checkout prompt', async () => {
    (getLocationPrompt as jest.Mock).mockResolvedValue({
      gymId: 'gym_1',
      id: 'prompt_2',
      occurredAt: '2026-04-02T11:15:00.000Z',
      type: 'checkout_suggested',
    });
    (getActiveVisit as jest.Mock).mockResolvedValue({
      confidence: 'high',
      gymId: 'gym_1',
      id: 'visit_1',
      notes: 'Prompted start',
      source: 'prompted',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'active',
    });
    (updateVisit as jest.Mock).mockResolvedValue({
      id: 'visit_1',
      status: 'completed',
    });
    (markLocationPromptAccepted as jest.Mock).mockResolvedValue({
      id: 'prompt_2',
      relatedVisitId: 'visit_1',
      wasAccepted: true,
    });

    const result = await completeActiveVisit('prompt_2');

    expect(updateVisit).toHaveBeenCalledWith('visit_1', {
      confidence: 'high',
      durationMinutes: 75,
      endedAt: '2026-04-02T11:15:00.000Z',
      gymId: 'gym_1',
      notes: 'Prompted start',
      source: 'prompted',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'completed',
    });
    expect(markLocationPromptAccepted).toHaveBeenCalledWith(
      'prompt_2',
      'visit_1',
    );
    expect(result.visit.status).toBe('completed');
  });

  it('fails when no active visit exists', async () => {
    (getLocationPrompt as jest.Mock).mockResolvedValue({
      gymId: 'gym_1',
      id: 'prompt_2',
      occurredAt: '2026-04-02T11:15:00.000Z',
      type: 'exit',
    });
    (getActiveVisit as jest.Mock).mockResolvedValue(null);

    await expect(completeActiveVisit('prompt_2')).rejects.toBeInstanceOf(
      ActiveVisitNotFoundError,
    );
    expect(updateVisit).not.toHaveBeenCalled();
  });
});
