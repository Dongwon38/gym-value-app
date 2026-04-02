import type { DashboardRangeType } from '../models';

export interface DashboardDateRange {
  endDate: string;
  rangeType: DashboardRangeType;
  startDate: string;
}

type DateOnlyParts = {
  day: number;
  month: number;
  year: number;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function formatDateOnly(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateOnlyParts(value: string): DateOnlyParts {
  const [year, month, day] = value.split('-').map(Number);

  return {
    day,
    month,
    year,
  };
}

export function createDateOnly(
  year: number,
  month: number,
  day: number,
) {
  const lastDay = getLastDayOfMonth(year, month);
  const clampedDay = Math.min(day, lastDay);

  return `${year}-${pad(month)}-${pad(clampedDay)}`;
}

export function addMonthsToDateOnly(value: string, monthsToAdd: number) {
  const { day, month, year } = parseDateOnlyParts(value);
  const nextDate = new Date(year, month - 1 + monthsToAdd, 1);

  return createDateOnly(
    nextDate.getFullYear(),
    nextDate.getMonth() + 1,
    day,
  );
}

export function getMonthStartDate(value: string) {
  const { month, year } = parseDateOnlyParts(value);

  return createDateOnly(year, month, 1);
}

export function getMonthEndDate(value: string) {
  const { month, year } = parseDateOnlyParts(value);

  return createDateOnly(year, month, getLastDayOfMonth(year, month));
}

export function getLocalDateOnly(dateTimeValue: string) {
  return formatDateOnly(new Date(dateTimeValue));
}

export function isDateWithinRange(
  value: string,
  range: Pick<DashboardDateRange, 'endDate' | 'startDate'>,
) {
  return value >= range.startDate && value <= range.endDate;
}

export function doDateRangesOverlap(
  startDate: string,
  endDate: string | null,
  range: Pick<DashboardDateRange, 'endDate' | 'startDate'>,
) {
  const effectiveEndDate = endDate ?? '9999-12-31';

  return startDate <= range.endDate && effectiveEndDate >= range.startDate;
}

export function buildDashboardDateRange(
  rangeType: Exclude<DashboardRangeType, 'all_time'>,
  now = new Date(),
): DashboardDateRange {
  if (rangeType === 'current_month') {
    const currentMonth = formatDateOnly(now);

    return {
      endDate: getMonthEndDate(currentMonth),
      rangeType,
      startDate: getMonthStartDate(currentMonth),
    };
  }

  const year = now.getFullYear();

  return {
    endDate: createDateOnly(year, 12, 31),
    rangeType,
    startDate: createDateOnly(year, 1, 1),
  };
}

export function buildAllTimeDateRange(
  candidateStartDates: string[],
  now = new Date(),
): DashboardDateRange {
  const sortedStartDates = candidateStartDates.filter(Boolean).sort();
  const fallbackDate = formatDateOnly(now);

  return {
    endDate: fallbackDate,
    rangeType: 'all_time',
    startDate: sortedStartDates[0] ?? fallbackDate,
  };
}
