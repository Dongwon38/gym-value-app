import type { Visit, VisitSource, VisitStatus } from '../../../domain/models';

export type VisitPeriod = 'month' | 'year';
export type VisitPeriodSelection = {
  month: number;
  year: number;
};

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

function isInSelectionMonth(date: Date, selection: VisitPeriodSelection) {
  return (
    date.getFullYear() === selection.year && date.getMonth() === selection.month
  );
}

function isInSelectionYear(date: Date, selection: VisitPeriodSelection) {
  return date.getFullYear() === selection.year;
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
  selection: VisitPeriodSelection,
) {
  return visits.filter(visit => {
    const startedAt = parseVisitStartedAt(visit);

    if (!startedAt) {
      return false;
    }

    const localStartedAt = normalizeToLocalDate(startedAt);

    if (period === 'month') {
      return isInSelectionMonth(localStartedAt, selection);
    }

    return isInSelectionYear(localStartedAt, selection);
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
  filteredVisits: Visit[],
  period: VisitPeriod,
  selection: VisitPeriodSelection,
) {
  const countLabel = `${filteredVisits.length} visit${filteredVisits.length === 1 ? '' : 's'}`;

  if (period === 'month') {
    return `${countLabel} in ${formatVisitMonthYearLabel(selection.month, selection.year)} · ${filteredVisits.length} total shown`;
  }

  return `${countLabel} in ${selection.year} · ${filteredVisits.length} total shown`;
}

export function buildVisitHeatmap(
  visits: Visit[],
  year: number,
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

  const startDate = startOfWeek(new Date(year, 0, 1));
  const endDate = endOfWeek(new Date(year, 11, 31));

  const weeks: VisitHeatmapWeek[] = [];
  let cursor = startDate;
  let previousVisibleMonth: number | null = null;

  while (cursor.getTime() <= endDate.getTime()) {
    const weekStart = cursor;
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const dayDate = addDays(weekStart, dayIndex);
      const dateKey = toLocalDateKey(dayDate);
      const visitCount = countsByDateKey.get(dateKey) ?? 0;

      return {
        dateKey,
        isFuture: year === today.getFullYear() && dayDate.getTime() > today.getTime(),
        isMuted: dayDate.getFullYear() !== year,
        level: getHeatmapLevel(visitCount),
        visitCount,
      } satisfies VisitHeatmapCell;
    });

    const firstVisibleDay = days.find(day => day.dateKey.startsWith(`${year}-`));
    const visibleMonth =
      firstVisibleDay !== undefined
        ? Number(firstVisibleDay.dateKey.slice(5, 7)) - 1
        : null;
    const label =
      visibleMonth !== null &&
      (previousVisibleMonth === null || previousVisibleMonth !== visibleMonth)
        ? monthLabels[visibleMonth]
        : null;

    weeks.push({ days, label });
    previousVisibleMonth = visibleMonth ?? previousVisibleMonth;
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

  return 'Year';
}

export function formatVisitMonthYearLabel(month: number, year: number) {
  return `${monthLabels[month]} ${year}`;
}

export function formatVisitPickerLabel(
  period: VisitPeriod,
  selection: VisitPeriodSelection,
) {
  if (period === 'month') {
    return formatVisitMonthYearLabel(selection.month, selection.year);
  }

  return String(selection.year);
}

export function buildVisitYearOptions(
  visits: Visit[],
  selectedYear: number,
  now = new Date(),
) {
  const years = new Set<number>([normalizeToLocalDate(now).getFullYear(), selectedYear]);

  visits.forEach(visit => {
    const startedAt = parseVisitStartedAt(visit);

    if (!startedAt) {
      return;
    }

    years.add(startedAt.getFullYear());
  });

  return Array.from(years).sort((left, right) => right - left);
}

export function getVisitPeriodEmptyTitle(
  period: VisitPeriod,
  selection: VisitPeriodSelection,
) {
  if (period === 'month') {
    return `No visits in ${formatVisitMonthYearLabel(selection.month, selection.year)}`;
  }

  return `No visits in ${selection.year}`;
}

export function getVisitPeriodEmptyBody(
  period: VisitPeriod,
  selection: VisitPeriodSelection,
) {
  if (period === 'month') {
    return `Try the full ${selection.year} view or add a visit for ${formatVisitMonthYearLabel(selection.month, selection.year)}.`;
  }

  return `Add a visit to start building the ${selection.year} timeline.`;
}
