import { defaultAppSettingsValues } from '../constants';
import type { AppSettings, FeeItem, Visit } from '../models';
import {
  buildDashboardStats,
  resolveDashboardRange,
} from './dashboard';

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

function createFeeItem(overrides: Partial<FeeItem> = {}): FeeItem {
  return {
    amountPreTax: 50,
    billingAnchorDate: null,
    cadence: 'monthly',
    category: 'monthly_membership',
    createdAt: '2026-01-01T00:00:00.000Z',
    endDate: null,
    gstRate: 0.05,
    gymId: 'gym_1',
    id: 'fee_1',
    isActive: true,
    label: 'Monthly Membership',
    pstRate: 0,
    sortOrder: 0,
    startDate: '2026-01-01',
    taxMode: 'custom',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    confidence: 'high',
    createdAt: '2026-01-01T00:00:00.000Z',
    durationMinutes: 60,
    endedAt: '2026-01-10T19:00:00.000Z',
    gymId: 'gym_1',
    id: 'visit_1',
    notes: null,
    source: 'manual',
    startedAt: '2026-01-10T18:00:00.000Z',
    status: 'completed',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('dashboard calculations', () => {
  it('builds current year dashboard stats from fee items and completed visits', () => {
    const range = resolveDashboardRange(
      'current_year',
      [createFeeItem()],
      [createVisit()],
      new Date('2026-04-02T12:00:00.000Z'),
    );
    const stats = buildDashboardStats({
      appSettings: createAppSettings(),
      feeItems: [
        createFeeItem(),
        createFeeItem({
          amountPreTax: 80,
          cadence: 'annual',
          id: 'fee_2',
          label: 'Annual Fee',
          startDate: '2026-01-15',
        }),
      ],
      range,
      visits: Array.from({ length: 40 }, (_, index) =>
        createVisit({
          durationMinutes: 80,
          id: `visit_${index + 1}`,
          startedAt: `2026-02-${String((index % 20) + 1).padStart(2, '0')}T18:00:00.000Z`,
        }),
      ),
    });

    expect(stats).toMatchObject({
      averageVisitLengthMinutes: 80,
      costPerHour: 13.3875,
      costPerVisit: 17.85,
      rangeType: 'current_year',
      totalDurationHours: 53.3333,
      totalDurationMinutes: 3200,
      totalPaid: 714,
      totalVisits: 40,
      uniqueVisitDays: 20,
    });
  });

  it('keeps totalPaid and cost metrics null when no fee occurrence exists', () => {
    const range = resolveDashboardRange(
      'current_year',
      [],
      [createVisit()],
      new Date('2026-04-02T12:00:00.000Z'),
    );
    const stats = buildDashboardStats({
      appSettings: createAppSettings(),
      feeItems: [],
      range,
      visits: [createVisit()],
    });

    expect(stats.totalPaid).toBeNull();
    expect(stats.costPerVisit).toBeNull();
    expect(stats.costPerHour).toBeNull();
    expect(stats.totalVisits).toBe(1);
  });

  it('excludes active visits from completed aggregates but surfaces active state', () => {
    const range = resolveDashboardRange(
      'current_year',
      [createFeeItem()],
      [
        createVisit(),
        createVisit({
          durationMinutes: null,
          endedAt: null,
          id: 'visit_active',
          startedAt: '2026-03-01T18:00:00.000Z',
          status: 'active',
        }),
      ],
      new Date('2026-04-02T12:00:00.000Z'),
    );
    const stats = buildDashboardStats({
      appSettings: createAppSettings(),
      feeItems: [createFeeItem()],
      range,
      visits: [
        createVisit(),
        createVisit({
          durationMinutes: null,
          endedAt: null,
          id: 'visit_active',
          startedAt: '2026-03-01T18:00:00.000Z',
          status: 'active',
        }),
      ],
    });

    expect(stats.totalVisits).toBe(1);
    expect(stats.hasActiveVisit).toBe(true);
    expect(stats.activeVisitId).toBe('visit_active');
    expect(stats.latestVisitAt).toBe('2026-03-01T18:00:00.000Z');
  });

  it('filters completed visits by started_at local date inside the range', () => {
    const range = resolveDashboardRange(
      'current_year',
      [createFeeItem()],
      [
        createVisit({ startedAt: '2025-12-31T18:00:00.000Z' }),
        createVisit({
          id: 'visit_2',
          startedAt: '2026-01-01T18:00:00.000Z',
        }),
      ],
      new Date('2026-04-02T12:00:00.000Z'),
    );
    const stats = buildDashboardStats({
      appSettings: createAppSettings(),
      feeItems: [createFeeItem()],
      range,
      visits: [
        createVisit({ startedAt: '2025-12-31T18:00:00.000Z' }),
        createVisit({
          id: 'visit_2',
          startedAt: '2026-01-01T18:00:00.000Z',
        }),
      ],
    });

    expect(stats.totalVisits).toBe(1);
    expect(stats.latestVisitAt).toBe('2026-01-01T18:00:00.000Z');
  });
});
