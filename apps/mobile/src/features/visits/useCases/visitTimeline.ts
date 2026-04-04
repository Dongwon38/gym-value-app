import type { Visit, VisitSource, VisitStatus } from '../../../domain/models';

export type VisitPeriod = 'month' | 'year' | 'all';

export type VisitHeatmapCell = {
  dateKey: string;
  isFuture: boolean;
  isMuted: boolean;
  level: 0 | 1 | 2 | 3;
  visitCount: number;
};

export type VisitHeatmapWeek = {
  days: VisitHeatmapCell[];
  label: string | null;
};

export const visitHeatmapWeekdayLabels = ['M', '', 'W', '', 'F', '', ''] as const;

function padDate(value: number) {
  return String(value).padStart(2, '0');
}

function normalizeToLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return normalizeToLocalDate(nextDate);
}

function startOfWeek(date: Date) {
  const normalizedDate = normalizeToLocalDate(date);
  const dayIndex = (normalizedDate.getDay() + 6) % 7;

  return addDays(normalizedDate, -dayIndex);
}

function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}`;
}

function parseVisitStartedAt(visit: Pick<Visit, 'startedAt'>) {
  const startedAt = new Date(visit.startedAt);

  if (Number.isNaN(startedAt.getTime())) {
    return null;
  }

  return startedAt;
}

function isSameMonth(date: Date, other: Date) {
  return (
    date.getFullYear() === other.getFullYear() &&
    date.getMonth() === other.getMonth()
  );
}

function isSameYear(date: Date, other: Date) {
  return date.getFullYear() === other.getFullYear();
}

function getHeatmapLevel(visitCount: number): VisitHeatmapCell['level'] {
  if (visitCount <= 0) {
    return 0;
  }

  if (visitCount === 1) {
    return 1;
  }

  if (visitCount === 2) {
    return 2;
  }

  return 3;
}

function formatTime(date: Date) {
  return `${padDate(date.getHours())}:${padDate(date.getMinutes())}`;
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const visitStatusLabels: Record<VisitStatus, string> = {
  active: 'Active',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export function filterVisitsByPeriod(
  visits: Visit[],
  period: VisitPeriod,
  now = new Date(),
) {
  const today = normalizeToLocalDate(now);

  return visits.filter(visit => {
    const startedAt = parseVisitStartedAt(visit);

    if (!startedAt) {
      return false;
    }

    const localStartedAt = normalizeToLocalDate(startedAt);

    if (period === 'month') {
      return isSameMonth(localStartedAt, today);
    }

    if (period === 'year') {
      return isSameYear(localStartedAt, today);
    }

    return true;
  });
}

export function getCurrentMonthVisitCount(visits: Visit[], now = new Date()) {
  const today = normalizeToLocalDate(now);

  return visits.filter(visit => {
    const startedAt = parseVisitStartedAt(visit);

    if (!startedAt) {
      return false;
    }

    return isSameMonth(normalizeToLocalDate(startedAt), today);
  }).length;
}

export function formatVisitSummaryLine(
  visits: Visit[],
  filteredVisits: Visit[],
  period: VisitPeriod,
  now = new Date(),
) {
  if (period === 'month') {
    return `${filteredVisits.length} visit${filteredVisits.length === 1 ? '' : 's'} this month · ${filteredVisits.length} total shown`;
  }

  const currentMonthVisitCount = getCurrentMonthVisitCount(visits, now);

  return `${currentMonthVisitCount} visit${currentMonthVisitCount === 1 ? '' : 's'} this month · ${filteredVisits.length} total shown`;
}

export function buildVisitHeatmap(
  visits: Visit[],
  period: VisitPeriod,
  now = new Date(),
) {
  const today = normalizeToLocalDate(now);
  const countsByDateKey = new Map<string, number>();

  visits.forEach(visit => {
    const startedAt = parseVisitStartedAt(visit);

    if (!startedAt) {
      return;
    }

    const dateKey = toLocalDateKey(normalizeToLocalDate(startedAt));
    countsByDateKey.set(dateKey, (countsByDateKey.get(dateKey) ?? 0) + 1);
  });

  let startDate: Date;
  let endDate: Date;

  if (period === 'month') {
    startDate = startOfWeek(startOfMonth(today));
    endDate = endOfWeek(endOfMonth(today));
  } else {
    endDate = endOfWeek(today);
    startDate = addDays(startOfWeek(today), -7 * 15);
  }

  const weeks: VisitHeatmapWeek[] = [];
  let cursor = startDate;
  let previousWeekMonth: number | null = null;

  while (cursor.getTime() <= endDate.getTime()) {
    const weekStart = cursor;
    const weekMonth = weekStart.getMonth();
    const label =
      previousWeekMonth === null || previousWeekMonth !== weekMonth
        ? monthLabels[weekMonth]
        : null;

    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const dayDate = addDays(weekStart, dayIndex);
      const dateKey = toLocalDateKey(dayDate);
      const visitCount = countsByDateKey.get(dateKey) ?? 0;

      return {
        dateKey,
        isFuture: dayDate.getTime() > today.getTime(),
        isMuted: period === 'month' && !isSameMonth(dayDate, today),
        level: getHeatmapLevel(visitCount),
        visitCount,
      } satisfies VisitHeatmapCell;
    });

    weeks.push({ days, label });
    previousWeekMonth = weekMonth;
    cursor = addDays(weekStart, 7);
  }

  return {
    weeks,
    weekdayLabels: visitHeatmapWeekdayLabels,
  };
}

export function formatVisitDateBadge(visit: Pick<Visit, 'startedAt'>) {
  const startedAt = parseVisitStartedAt(visit);

  if (!startedAt) {
    return '--/--';
  }

  return `${padDate(startedAt.getMonth() + 1)}/${padDate(startedAt.getDate())}`;
}

export function formatVisitTimeRange(visit: Pick<Visit, 'endedAt' | 'startedAt'>) {
  const startedAt = parseVisitStartedAt(visit);

  if (!startedAt) {
    return visit.startedAt;
  }

  if (!visit.endedAt) {
    return `${formatTime(startedAt)} - Active`;
  }

  const endedAt = new Date(visit.endedAt);

  if (Number.isNaN(endedAt.getTime())) {
    return `${formatTime(startedAt)} - ${visit.endedAt}`;
  }

  return `${formatTime(startedAt)} - ${formatTime(endedAt)}`;
}

export function formatVisitSourceShort(source: VisitSource) {
  if (source === 'prompted') {
    return 'auto';
  }

  if (source === 'recovered') {
    return 'recovered';
  }

  return 'manual';
}

export function formatVisitDurationLabel(durationMinutes: number | null) {
  if (durationMinutes === null) {
    return 'In progress';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function formatVisitStatusLabel(status: VisitStatus) {
  return visitStatusLabels[status];
}

export function formatVisitSourceTypeLabel(source: VisitSource) {
  if (source === 'prompted') {
    return 'Auto';
  }

  if (source === 'recovered') {
    return 'Recovered';
  }

  return 'Manual';
}

export function formatVisitFeedMeta(visit: Pick<Visit, 'durationMinutes' | 'source'>) {
  return `${formatVisitDurationLabel(visit.durationMinutes)} · ${formatVisitSourceShort(visit.source)}`;
}

export function getVisitPeriodLabel(period: VisitPeriod) {
  if (period === 'month') {
    return 'Month';
  }

  if (period === 'year') {
    return 'Year';
  }

  return 'All';
}

export function getVisitPeriodEmptyTitle(period: VisitPeriod) {
  if (period === 'month') {
    return 'No visits this month';
  }

  if (period === 'year') {
    return 'No visits this year';
  }

  return 'No visits saved yet';
}

export function getVisitPeriodEmptyBody(period: VisitPeriod) {
  if (period === 'month') {
    return 'Try a wider range or add a new visit for the current month.';
  }

  if (period === 'year') {
    return 'Try the full history view or add a new visit for this year.';
  }

  return 'Create the first visit to start building your visit timeline.';
}
