jest.mock('../../../data/repositories', () => ({
  createVisit: jest.fn(),
  getActiveVisit: jest.fn(),
  getLocationPrompt: jest.fn(),
  markLocationPromptAccepted: jest.fn(),
}));

import {
  createVisit,
  getActiveVisit,
  getLocationPrompt,
  markLocationPromptAccepted,
} from '../../../data/repositories';
import {
  AssistedVisitConflictError,
  startVisitFromPrompt,
} from './startVisitFromPrompt';

describe('startVisitFromPrompt', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates an active prompted visit from a check-in prompt', async () => {
    (getLocationPrompt as jest.Mock).mockResolvedValue({
      gymId: 'gym_1',
      id: 'prompt_1',
      occurredAt: '2026-04-02T10:00:00.000Z',
      type: 'checkin_suggested',
    });
    (getActiveVisit as jest.Mock).mockResolvedValue(null);
    (createVisit as jest.Mock).mockResolvedValue({
      gymId: 'gym_1',
      id: 'visit_1',
      source: 'prompted',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'active',
    });
    (markLocationPromptAccepted as jest.Mock).mockResolvedValue({
      id: 'prompt_1',
      relatedVisitId: 'visit_1',
      wasAccepted: true,
    });

    const result = await startVisitFromPrompt('prompt_1');

    expect(createVisit).toHaveBeenCalledWith({
      durationMinutes: null,
      endedAt: null,
      gymId: 'gym_1',
      source: 'prompted',
      startedAt: '2026-04-02T10:00:00.000Z',
      status: 'active',
    });
    expect(markLocationPromptAccepted).toHaveBeenCalledWith(
      'prompt_1',
      'visit_1',
    );
    expect(result.visit.id).toBe('visit_1');
  });

  it('blocks prompted check-in when an active visit already exists', async () => {
    (getLocationPrompt as jest.Mock).mockResolvedValue({
      gymId: 'gym_1',
      id: 'prompt_1',
      occurredAt: '2026-04-02T10:00:00.000Z',
      type: 'enter',
    });
    (getActiveVisit as jest.Mock).mockResolvedValue({
      id: 'visit_active',
      status: 'active',
    });

    await expect(startVisitFromPrompt('prompt_1')).rejects.toBeInstanceOf(
      AssistedVisitConflictError,
    );
    expect(createVisit).not.toHaveBeenCalled();
  });
});
