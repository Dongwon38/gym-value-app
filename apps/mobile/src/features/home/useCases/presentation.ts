import type { AppSettings, DashboardStats } from '../../../domain/models';
import type { DashboardDateRange } from '../../../domain/calculations';

function formatCompactDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDashboardCurrency(
  value: number,
  settings: Pick<AppSettings, 'currency' | 'locale'>,
) {
  return new Intl.NumberFormat(settings.locale, {
    currency: settings.currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value);
}

export function formatDashboardHours(value: number) {
  return `${value.toFixed(1)} hr`;
}

export function formatDashboardVisitLength(value: number | null) {
  if (value === null) {
    return 'No completed visits yet';
  }

  const roundedMinutes = Math.round(value);
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function formatDashboardRangeLabel(range: DashboardDateRange) {
  if (range.rangeType === 'current_month') {
    return 'Current month';
  }

  if (range.rangeType === 'all_time') {
    return 'All time';
  }

  return 'Current year';
}

export function formatDashboardRangeWindow(
  range: DashboardDateRange,
  settings: Pick<AppSettings, 'locale'>,
) {
  const locale = settings.locale;

  return `${formatCompactDate(range.startDate, locale)} to ${formatCompactDate(
    range.endDate,
    locale,
  )}`;
}

export function formatLatestVisitAt(
  value: DashboardStats['latestVisitAt'],
  settings: Pick<AppSettings, 'locale'>,
) {
  if (!value) {
    return 'No visits in this range yet';
  }

  return new Intl.DateTimeFormat(settings.locale, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
