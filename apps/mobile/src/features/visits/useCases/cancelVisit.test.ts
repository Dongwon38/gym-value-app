jest.mock('../../../data/repositories', () => ({
  cancelVisit: jest.fn(),
}));

import { cancelVisit as cancelVisitRepository } from '../../../data/repositories';
import { cancelVisit } from './cancelVisit';

describe('cancelVisit', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to the visit repository cancel path', async () => {
    (cancelVisitRepository as jest.Mock).mockResolvedValue({
      id: 'visit_1',
      status: 'cancelled',
    });

    await cancelVisit({ id: 'visit_1' });

    expect(cancelVisitRepository).toHaveBeenCalledWith('visit_1');
  });
});
