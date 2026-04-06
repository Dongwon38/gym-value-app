import type { Visit } from '../../../domain/models';
import {
  buildVisitHeatmap,
  buildVisitYearOptions,
  filterVisitsByPeriod,
  formatVisitFeedMeta,
  formatVisitPickerLabel,
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
    expect(
      filterVisitsByPeriod(visits, 'month', { month: 3, year: 2026 }),
    ).toHaveLength(2);
    expect(
      filterVisitsByPeriod(visits, 'year', { month: 3, year: 2026 }),
    ).toHaveLength(3);
  });

  it('builds a visit summary line from the selected range', () => {
    const filteredVisits = filterVisitsByPeriod(visits, 'year', {
      month: 3,
      year: 2026,
    });

    expect(
      formatVisitSummaryLine(filteredVisits, 'year', { month: 3, year: 2026 }),
    ).toBe('3 visits in 2026 · 3 total shown');
  });

  it('builds a full-year heatmap with visit levels for the selected year', () => {
    const heatmap = buildVisitHeatmap(visits, 2026, referenceDate);
    const populatedCell = heatmap.weeks
      .flatMap(week => week.days)
      .find(cell => cell.dateKey === '2026-04-03');
    const visibleLabels = heatmap.weeks
      .map(week => week.label)
      .filter((label): label is string => label !== null);

    expect(heatmap.weeks.length).toBeGreaterThanOrEqual(52);
    expect(visibleLabels[0]).toBe('Jan');
    expect(populatedCell).toMatchObject({
      dateKey: '2026-04-03',
      level: 1,
      visitCount: 1,
    });
  });

  it('formats picker labels and year options from local data', () => {
    expect(formatVisitPickerLabel('month', { month: 3, year: 2026 })).toBe('Apr 2026');
    expect(formatVisitPickerLabel('year', { month: 3, year: 2026 })).toBe('2026');
    expect(buildVisitYearOptions(visits, 2026, referenceDate)).toEqual([2026, 2025]);
  });

  it('formats visit feed metadata with duration and source', () => {
    expect(
      formatVisitFeedMeta(
        createVisit('2026-04-03T18:10:00-07:00', { source: 'prompted' }),
      ),
    ).toBe('1 hr 15 min · auto');
  });
});
