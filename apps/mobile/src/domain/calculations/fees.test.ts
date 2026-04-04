import { defaultAppSettingsValues } from '../constants';
import type { AppSettings, FeeItem } from '../models';
import { buildDashboardDateRange } from './dateRange';
import {
  calculateFeeItemTotal,
  calculateTotalPaidForRange,
  expandFeeItemOccurrencesForRange,
  resolveEffectiveTaxRates,
} from './fees';

function createFeeItem(overrides: Partial<FeeItem> = {}): FeeItem {
  return {
    amountPreTax: 50,
    billingAnchorDate: null,
    cadence: 'monthly',
    category: 'monthly_membership',
    createdAt: '2026-01-01T00:00:00.000Z',
    endDate: null,
    gstRate: null,
    gymId: 'gym_1',
    id: 'fee_1',
    isActive: true,
    label: 'Monthly Membership',
    pstRate: null,
    sortOrder: 0,
    startDate: '2026-01-01',
    taxMode: 'inherit_default',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createAppSettings(
  overrides: Partial<AppSettings> = {},
): AppSettings {
  return {
    checkinSuggestionsEnabled: true,
    checkoutSuggestionsEnabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    currency: 'CAD',
    defaultGstRate: defaultAppSettingsValues.defaultGstRate,
    defaultPstRate: defaultAppSettingsValues.defaultPstRate,
    homePrimaryMetric: 'cost_per_visit',
    id: 'default',
    locale: 'en-CA',
    regionPreset: 'BC_CA',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('fee calculations', () => {
  it('resolves BC default GST and PST rates for inherit_default items', () => {
    const taxRates = resolveEffectiveTaxRates(
      createFeeItem(),
      createAppSettings(),
    );

    expect(taxRates).toEqual({
      combinedRate: 0.12,
      gstRate: 0.05,
      pstRate: 0.07,
    });
  });

  it('uses custom tax overrides when tax_mode is custom', () => {
    const feeItemTotal = calculateFeeItemTotal(
      createFeeItem({
        amountPreTax: 30,
        gstRate: 0.05,
        pstRate: 0,
        taxMode: 'custom',
      }),
      createAppSettings(),
    );

    expect(feeItemTotal.totalTaxAmount).toBe(1.5);
    expect(feeItemTotal.totalAmount).toBe(31.5);
  });

  it('resolves no-tax lines to zero GST and PST', () => {
    const feeItemTotal = calculateFeeItemTotal(
      createFeeItem({
        amountPreTax: 30,
        taxMode: 'none',
      }),
      createAppSettings(),
    );

    expect(feeItemTotal.effectiveTaxRates).toEqual({
      combinedRate: 0,
      gstRate: 0,
      pstRate: 0,
    });
    expect(feeItemTotal.totalTaxAmount).toBe(0);
    expect(feeItemTotal.totalAmount).toBe(30);
  });

  it('expands monthly occurrences across each active month in range', () => {
    const range = buildDashboardDateRange(
      'current_year',
      new Date('2026-07-15T12:00:00.000Z'),
    );
    const occurrences = expandFeeItemOccurrencesForRange(
      createFeeItem({
        gstRate: 0.05,
        pstRate: 0,
        startDate: '2026-01-10',
        taxMode: 'custom',
      }),
      range,
      createAppSettings(),
    );

    expect(occurrences).toHaveLength(12);
    expect(occurrences[0]?.occurrenceDate).toBe('2026-01-10');
    expect(occurrences[11]?.occurrenceDate).toBe('2026-12-01');
    expect(calculateTotalPaidForRange(
      [
        createFeeItem({
          gstRate: 0.05,
          pstRate: 0,
          startDate: '2026-01-10',
          taxMode: 'custom',
        }),
      ],
      range,
      createAppSettings(),
    )).toBe(630);
  });

  it('counts annual occurrences by anniversary date inside range', () => {
    const range = buildDashboardDateRange(
      'current_year',
      new Date('2026-04-02T12:00:00.000Z'),
    );
    const occurrences = expandFeeItemOccurrencesForRange(
      createFeeItem({
        amountPreTax: 80,
        cadence: 'annual',
        gstRate: 0.05,
        label: 'Annual Fee',
        pstRate: 0,
        startDate: '2025-03-01',
        taxMode: 'custom',
      }),
      range,
      createAppSettings(),
    );

    expect(occurrences).toEqual([
      expect.objectContaining({
        occurrenceDate: '2026-03-01',
        totalAmount: 84,
      }),
    ]);
  });

  it('uses billing anchor date for annual occurrences when provided', () => {
    const range = buildDashboardDateRange(
      'current_year',
      new Date('2026-08-02T12:00:00.000Z'),
    );
    const occurrences = expandFeeItemOccurrencesForRange(
      createFeeItem({
        amountPreTax: 80,
        billingAnchorDate: '2025-07-15',
        cadence: 'annual',
        gstRate: 0.05,
        label: 'Annual Fee',
        pstRate: 0,
        startDate: '2025-03-01',
        taxMode: 'custom',
      }),
      range,
      createAppSettings(),
    );

    expect(occurrences).toEqual([
      expect.objectContaining({
        occurrenceDate: '2026-07-15',
        totalAmount: 84,
      }),
    ]);
  });

  it('expands bi-weekly occurrences using billing anchor date', () => {
    const range = buildDashboardDateRange(
      'current_year',
      new Date('2026-02-15T12:00:00.000Z'),
    );
    const occurrences = expandFeeItemOccurrencesForRange(
      createFeeItem({
        amountPreTax: 25,
        billingAnchorDate: '2025-12-31',
        cadence: 'bi_weekly',
        gstRate: 0.05,
        id: 'fee_bi_weekly',
        label: 'Bi-weekly membership',
        pstRate: 0,
        startDate: '2026-01-01',
        taxMode: 'custom',
      }),
      range,
      createAppSettings(),
    );

    expect(occurrences.map(occurrence => occurrence.occurrenceDate)).toEqual([
      '2026-01-14',
      '2026-01-28',
      '2026-02-11',
      '2026-02-25',
      '2026-03-11',
      '2026-03-25',
      '2026-04-08',
      '2026-04-22',
      '2026-05-06',
      '2026-05-20',
      '2026-06-03',
      '2026-06-17',
      '2026-07-01',
      '2026-07-15',
      '2026-07-29',
      '2026-08-12',
      '2026-08-26',
      '2026-09-09',
      '2026-09-23',
      '2026-10-07',
      '2026-10-21',
      '2026-11-04',
      '2026-11-18',
      '2026-12-02',
      '2026-12-16',
      '2026-12-30',
    ]);
    expect(occurrences[0]?.totalAmount).toBe(26.25);
  });

  it('includes one-time fees only when start_date is inside the range', () => {
    const range = buildDashboardDateRange(
      'current_year',
      new Date('2026-04-02T12:00:00.000Z'),
    );
    const inRangeOccurrences = expandFeeItemOccurrencesForRange(
      createFeeItem({
        amountPreTax: 30,
        cadence: 'one_time',
        gstRate: 0.05,
        pstRate: 0,
        startDate: '2026-01-05',
        taxMode: 'custom',
      }),
      range,
      createAppSettings(),
    );
    const outOfRangeOccurrences = expandFeeItemOccurrencesForRange(
      createFeeItem({
        amountPreTax: 30,
        cadence: 'one_time',
        gstRate: 0.05,
        id: 'fee_2',
        pstRate: 0,
        startDate: '2025-12-31',
        taxMode: 'custom',
      }),
      range,
      createAppSettings(),
    );

    expect(inRangeOccurrences).toHaveLength(1);
    expect(inRangeOccurrences[0]?.totalAmount).toBe(31.5);
    expect(outOfRangeOccurrences).toHaveLength(0);
  });
});
