import type { AppSettings, DashboardStats, FeeItem, Visit } from '../models';

import {
  buildAllTimeDateRange,
  buildDashboardDateRange,
  getLocalDateOnly,
  isDateWithinRange,
  type DashboardDateRange,
} from './dateRange';
import { expandFeeItemsForRange } from './fees';

type DashboardStatsInput = {
  appSettings: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'>;
  feeItems: Array<
    Pick<
      FeeItem,
      | 'amountPreTax'
      | 'cadence'
      | 'endDate'
      | 'gstRate'
      | 'id'
      | 'isActive'
      | 'pstRate'
      | 'startDate'
      | 'taxMode'
    >
  >;
  range: DashboardDateRange;
  visits: Array<
    Pick<Visit, 'durationMinutes' | 'id' | 'startedAt' | 'status'>
  >;
};

function roundMetric(value: number) {
  return Number(value.toFixed(4));
}

export function getCompletedVisitsInRange(
  visits: Array<Pick<Visit, 'startedAt' | 'status' | 'durationMinutes' | 'id'>>,
  range: Pick<DashboardDateRange, 'endDate' | 'startDate'>,
) {
  return visits.filter(
    visit =>
      visit.status === 'completed' &&
      isDateWithinRange(getLocalDateOnly(visit.startedAt), range),
  );
}

export function sumDurationMinutes(
  visits: Array<Pick<Visit, 'durationMinutes'>>,
) {
  return visits.reduce(
    (sum, visit) => sum + (visit.durationMinutes ?? 0),
    0,
  );
}

export function countUniqueVisitDays(
  visits: Array<Pick<Visit, 'startedAt'>>,
) {
  return new Set(visits.map(visit => getLocalDateOnly(visit.startedAt))).size;
}

export function calculateAverageVisitLength(
  totalDurationMinutes: number,
  totalVisits: number,
) {
  if (totalVisits === 0) {
    return null;
  }

  return roundMetric(totalDurationMinutes / totalVisits);
}

export function calculateCostPerVisit(
  totalPaid: number | null,
  totalVisits: number,
) {
  if (totalPaid === null || totalVisits === 0) {
    return null;
  }

  return roundMetric(totalPaid / totalVisits);
}

export function calculateCostPerHour(
  totalPaid: number | null,
  totalDurationHours: number,
) {
  if (totalPaid === null || totalDurationHours === 0) {
    return null;
  }

  return roundMetric(totalPaid / totalDurationHours);
}

export function calculateCostPerActiveDay(
  totalPaid: number | null,
  uniqueVisitDays: number,
) {
  if (totalPaid === null || uniqueVisitDays === 0) {
    return null;
  }

  return roundMetric(totalPaid / uniqueVisitDays);
}

export function resolveDashboardRange(
  rangeType: DashboardDateRange['rangeType'],
  feeItems: Array<Pick<FeeItem, 'startDate'>>,
  visits: Array<Pick<Visit, 'startedAt'>>,
  now = new Date(),
) {
  if (rangeType === 'all_time') {
    return buildAllTimeDateRange(
      [
        ...feeItems.map(feeItem => feeItem.startDate),
        ...visits.map(visit => getLocalDateOnly(visit.startedAt)),
      ],
      now,
    );
  }

  return buildDashboardDateRange(rangeType, now);
}

export function buildDashboardStats({
  appSettings,
  feeItems,
  range,
  visits,
}: DashboardStatsInput): DashboardStats {
  const completedVisits = getCompletedVisitsInRange(visits, range);
  const totalVisits = completedVisits.length;
  const totalDurationMinutes = sumDurationMinutes(completedVisits);
  const totalDurationHours = roundMetric(totalDurationMinutes / 60);
  const uniqueVisitDays = countUniqueVisitDays(completedVisits);
  const occurrences = expandFeeItemsForRange(feeItems, range, appSettings);
  const totalPaid =
    occurrences.length === 0
      ? null
      : roundMetric(
          occurrences.reduce((sum, occurrence) => sum + occurrence.totalAmount, 0),
        );
  const rangeRelevantVisits = visits.filter(visit =>
    isDateWithinRange(getLocalDateOnly(visit.startedAt), range),
  );
  const activeVisit = visits.find(visit => visit.status === 'active');
  const latestVisitAt = [...rangeRelevantVisits]
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0]
    ?.startedAt;

  return {
    activeVisitId: activeVisit?.id,
    averageVisitLengthMinutes: calculateAverageVisitLength(
      totalDurationMinutes,
      totalVisits,
    ),
    costPerActiveDay: calculateCostPerActiveDay(totalPaid, uniqueVisitDays),
    costPerHour: calculateCostPerHour(totalPaid, totalDurationHours),
    costPerVisit: calculateCostPerVisit(totalPaid, totalVisits),
    hasActiveVisit: activeVisit !== undefined,
    latestVisitAt,
    rangeType: range.rangeType,
    totalDurationHours,
    totalDurationMinutes,
    totalPaid,
    totalVisits,
    uniqueVisitDays,
  };
}
