import type { Visit } from '../../../domain/models';
import {
  buildVisitHeatmap,
  filterVisitsByPeriod,
  formatVisitFeedMeta,
  formatVisitSummaryLine,
} from './visitTimeline';

function createVisit(
  startedAt: string,
  overrides: Partial<Visit> = {},
): Visit {
  return {
    confidence: 'high',
    createdAt: startedAt,
    durationMinutes: 75,
    endedAt: '2026-04-03T19:25:00-07:00',
    gymId: 'gym_1',
    id: `visit_${startedAt}`,
    notes: null,
    source: 'manual',
    startedAt,
    status: 'completed',
    updatedAt: startedAt,
    ...overrides,
  };
}

describe('visitTimeline', () => {
  const referenceDate = new Date('2026-04-04T12:00:00-07:00');
  const visits = [
    createVisit('2026-04-03T18:10:00-07:00'),
    createVisit('2026-04-01T06:30:00-07:00'),
    createVisit('2026-03-30T17:00:00-07:00'),
    createVisit('2025-12-31T17:00:00-08:00'),
  ];

  it('filters visits for the current month and year', () => {
    expect(filterVisitsByPeriod(visits, 'month', referenceDate)).toHaveLength(2);
    expect(filterVisitsByPeriod(visits, 'year', referenceDate)).toHaveLength(3);
    expect(filterVisitsByPeriod(visits, 'all', referenceDate)).toHaveLength(4);
  });

  it('builds a visit summary line from the selected range', () => {
    const filteredVisits = filterVisitsByPeriod(visits, 'year', referenceDate);

    expect(formatVisitSummaryLine(visits, filteredVisits, 'year', referenceDate)).toBe(
      '2 visits this month · 3 total shown',
    );
  });

  it('builds a heatmap with visit levels for the selected range', () => {
    const filteredVisits = filterVisitsByPeriod(visits, 'month', referenceDate);
    const heatmap = buildVisitHeatmap(filteredVisits, 'month', referenceDate);
    const populatedCell = heatmap.weeks
      .flatMap(week => week.days)
      .find(cell => cell.dateKey === '2026-04-03');

    expect(heatmap.weeks.length).toBeGreaterThanOrEqual(5);
    expect(populatedCell).toMatchObject({
      dateKey: '2026-04-03',
      level: 1,
      visitCount: 1,
    });
  });

  it('formats visit feed metadata with duration and source', () => {
    expect(
      formatVisitFeedMeta(
        createVisit('2026-04-03T18:10:00-07:00', { source: 'prompted' }),
      ),
    ).toBe('1 hr 15 min · auto');
  });
});
