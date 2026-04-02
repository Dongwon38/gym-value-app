import {
  activeVisitAttentionThresholdMinutes,
  getActiveVisitElapsedMinutes,
  shouldReviewActiveVisit,
} from './sessionReview';

describe('active visit session review', () => {
  it('derives elapsed minutes for active visits', () => {
    expect(
      getActiveVisitElapsedMinutes(
        {
          startedAt: '2026-04-02T10:00:00.000Z',
          status: 'active',
        },
        new Date('2026-04-02T11:15:00.000Z'),
      ),
    ).toBe(75);
  });

  it('flags unusually long active visits for review', () => {
    expect(
      shouldReviewActiveVisit(
        {
          startedAt: '2026-04-02T00:00:00.000Z',
          status: 'active',
        },
        new Date('2026-04-02T08:00:00.000Z'),
      ),
    ).toBe(true);
    expect(activeVisitAttentionThresholdMinutes).toBe(480);
  });
});
