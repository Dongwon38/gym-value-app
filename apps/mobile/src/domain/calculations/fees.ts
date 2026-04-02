import type { AppSettings, FeeItem } from '../models';

import {
  addMonthsToDateOnly,
  createDateOnly,
  doDateRangesOverlap,
  getMonthEndDate,
  getMonthStartDate,
  isDateWithinRange,
  parseDateOnlyParts,
  type DashboardDateRange,
} from './dateRange';

export interface EffectiveTaxRates {
  combinedRate: number;
  gstRate: number;
  pstRate: number;
}

export interface FeeItemOccurrence {
  cadence: Exclude<FeeItem['cadence'], 'custom'>;
  feeItemId: string;
  occurrenceDate: string;
  totalAmount: number;
  totalTaxAmount: number;
}

export interface FeeItemTotal {
  effectiveTaxRates: EffectiveTaxRates;
  preTaxAmount: number;
  totalAmount: number;
  totalTaxAmount: number;
}

function resolveFeeItemEndDate(endDate: string | null) {
  return endDate ?? '9999-12-31';
}

function getMonthlyOccurrenceDates(
  feeItem: Pick<FeeItem, 'endDate' | 'startDate'>,
  range: Pick<DashboardDateRange, 'endDate' | 'startDate'>,
) {
  if (!doDateRangesOverlap(feeItem.startDate, feeItem.endDate, range)) {
    return [];
  }

  const occurrenceDates: string[] = [];
  let cursor = getMonthStartDate(range.startDate);
  const lastMonth = getMonthStartDate(range.endDate);
  const feeItemEndDate = resolveFeeItemEndDate(feeItem.endDate);

  while (cursor <= lastMonth) {
    const monthStart = cursor;
    const monthEnd = getMonthEndDate(cursor);

    if (feeItem.startDate <= monthEnd && feeItemEndDate >= monthStart) {
      occurrenceDates.push(
        feeItem.startDate >= monthStart && feeItem.startDate <= monthEnd
          ? feeItem.startDate
          : monthStart,
      );
    }

    cursor = getMonthStartDate(addMonthsToDateOnly(cursor, 1));
  }

  return occurrenceDates;
}

function getAnnualOccurrenceDates(
  feeItem: Pick<FeeItem, 'endDate' | 'startDate'>,
  range: Pick<DashboardDateRange, 'endDate' | 'startDate'>,
) {
  if (!doDateRangesOverlap(feeItem.startDate, feeItem.endDate, range)) {
    return [];
  }

  const occurrenceDates: string[] = [];
  const { day, month } = parseDateOnlyParts(feeItem.startDate);
  const { year: rangeStartYear } = parseDateOnlyParts(range.startDate);
  const { year: rangeEndYear } = parseDateOnlyParts(range.endDate);
  const feeItemEndDate = resolveFeeItemEndDate(feeItem.endDate);

  for (let currentYear = rangeStartYear; currentYear <= rangeEndYear; currentYear += 1) {
    const occurrenceDate = createDateOnly(currentYear, month, day);

    if (occurrenceDate < feeItem.startDate) {
      continue;
    }

    if (occurrenceDate > feeItemEndDate) {
      continue;
    }

    if (isDateWithinRange(occurrenceDate, range)) {
      occurrenceDates.push(occurrenceDate);
    }
  }

  return occurrenceDates;
}

function getOccurrenceDatesForRange(
  feeItem: Pick<FeeItem, 'cadence' | 'endDate' | 'startDate'>,
  range: Pick<DashboardDateRange, 'endDate' | 'startDate'>,
) {
  if (feeItem.cadence === 'custom') {
    return [];
  }

  if (feeItem.cadence === 'one_time') {
    return isDateWithinRange(feeItem.startDate, range) ? [feeItem.startDate] : [];
  }

  if (feeItem.cadence === 'monthly') {
    return getMonthlyOccurrenceDates(feeItem, range);
  }

  return getAnnualOccurrenceDates(feeItem, range);
}

export function resolveEffectiveTaxRates(
  feeItem: Pick<FeeItem, 'gstRate' | 'pstRate' | 'taxMode'>,
  appSettings: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'>,
): EffectiveTaxRates {
  const gstRate =
    feeItem.taxMode === 'custom'
      ? feeItem.gstRate ?? 0
      : appSettings.defaultGstRate;
  const pstRate =
    feeItem.taxMode === 'custom'
      ? feeItem.pstRate ?? 0
      : appSettings.defaultPstRate;

  return {
    combinedRate: Number((gstRate + pstRate).toFixed(10)),
    gstRate,
    pstRate,
  };
}

export function calculateFeeItemTotal(
  feeItem: Pick<FeeItem, 'amountPreTax' | 'gstRate' | 'pstRate' | 'taxMode'>,
  appSettings: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'>,
): FeeItemTotal {
  const effectiveTaxRates = resolveEffectiveTaxRates(feeItem, appSettings);
  const totalTaxAmount = feeItem.amountPreTax * effectiveTaxRates.combinedRate;

  return {
    effectiveTaxRates,
    preTaxAmount: feeItem.amountPreTax,
    totalAmount: feeItem.amountPreTax + totalTaxAmount,
    totalTaxAmount,
  };
}

export function expandFeeItemOccurrencesForRange(
  feeItem: Pick<
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
  >,
  range: Pick<DashboardDateRange, 'endDate' | 'startDate'>,
  appSettings: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'>,
) {
  if (!feeItem.isActive) {
    return [];
  }

  if (feeItem.endDate && feeItem.endDate < feeItem.startDate) {
    return [];
  }

  const occurrenceDates = getOccurrenceDatesForRange(feeItem, range);

  if (occurrenceDates.length === 0) {
    return [];
  }

  const feeItemTotal = calculateFeeItemTotal(feeItem, appSettings);

  return occurrenceDates.map(occurrenceDate => ({
    cadence: feeItem.cadence,
    feeItemId: feeItem.id,
    occurrenceDate,
    totalAmount: feeItemTotal.totalAmount,
    totalTaxAmount: feeItemTotal.totalTaxAmount,
  }));
}

export function expandFeeItemsForRange(
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
  >,
  range: Pick<DashboardDateRange, 'endDate' | 'startDate'>,
  appSettings: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'>,
) {
  return feeItems.flatMap(feeItem =>
    expandFeeItemOccurrencesForRange(feeItem, range, appSettings),
  );
}

export function calculateTotalPaidForRange(
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
  >,
  range: Pick<DashboardDateRange, 'endDate' | 'startDate'>,
  appSettings: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'>,
) {
  return expandFeeItemsForRange(feeItems, range, appSettings).reduce(
    (sum, occurrence) => sum + occurrence.totalAmount,
    0,
  );
}
