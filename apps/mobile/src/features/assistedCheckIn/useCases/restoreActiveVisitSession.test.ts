jest.mock('../../../data/repositories', () => ({
  getActiveVisit: jest.fn(),
  getLatestLocationPrompt: jest.fn(),
}));

import {
  getActiveVisit,
  getLatestLocationPrompt,
} from '../../../data/repositories';
import { restoreActiveVisitSession } from './restoreActiveVisitSession';

describe('restoreActiveVisitSession', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the related prompt when an active visit is restored', async () => {
    (getActiveVisit as jest.Mock).mockResolvedValue({
      gymId: 'gym_1',
      id: 'visit_1',
      status: 'active',
    });
    (getLatestLocationPrompt as jest.Mock).mockResolvedValueOnce({
      id: 'prompt_related',
      relatedVisitId: 'visit_1',
    });

    const snapshot = await restoreActiveVisitSession();

    expect(getLatestLocationPrompt).toHaveBeenCalledWith({
      relatedVisitId: 'visit_1',
    });
    expect(snapshot).toEqual({
      activeVisit: {
        gymId: 'gym_1',
        id: 'visit_1',
        status: 'active',
      },
      latestPrompt: {
        id: 'prompt_related',
        relatedVisitId: 'visit_1',
      },
    });
  });

  it('falls back to the latest global prompt when no active visit exists', async () => {
    (getActiveVisit as jest.Mock).mockResolvedValue(null);
    (getLatestLocationPrompt as jest.Mock).mockResolvedValue({
      id: 'prompt_global',
    });

    const snapshot = await restoreActiveVisitSession();

    expect(getLatestLocationPrompt).toHaveBeenCalledWith();
    expect(snapshot).toEqual({
      activeVisit: null,
      latestPrompt: {
        id: 'prompt_global',
      },
    });
  });
});
