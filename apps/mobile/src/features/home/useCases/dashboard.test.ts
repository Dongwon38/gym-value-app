jest.mock('../../../data/repositories', () => ({
  getPrimaryGym: jest.fn(),
  getSettings: jest.fn(),
  listFeeItems: jest.fn(),
  listVisits: jest.fn(),
}));

import {
  getPrimaryGym,
  getSettings,
  listFeeItems,
  listVisits,
} from '../../../data/repositories';
import { getHomeDashboardSnapshot } from './dashboard';

describe('getHomeDashboardSnapshot', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads repository data and builds a current year dashboard snapshot', async () => {
    (getPrimaryGym as jest.Mock).mockResolvedValue({
      id: 'gym_1',
      name: 'Downtown Gym',
    });
    (getSettings as jest.Mock).mockResolvedValue({
      checkinSuggestionsEnabled: true,
      checkoutSuggestionsEnabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      currency: 'CAD',
      defaultGstRate: 0.05,
      defaultPstRate: 0.07,
      homePrimaryMetric: 'cost_per_visit',
      id: 'default',
      locale: 'en-CA',
      regionPreset: 'BC_CA',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    (listFeeItems as jest.Mock).mockResolvedValue([
      {
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
      },
    ]);
    (listVisits as jest.Mock).mockResolvedValue([
      {
        confidence: 'high',
        createdAt: '2026-01-01T00:00:00.000Z',
        durationMinutes: 60,
        endedAt: '2026-02-10T19:00:00.000Z',
        gymId: 'gym_1',
        id: 'visit_1',
        notes: null,
        source: 'manual',
        startedAt: '2026-02-10T18:00:00.000Z',
        status: 'completed',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const snapshot = await getHomeDashboardSnapshot(
      'current_year',
      new Date('2026-04-02T12:00:00.000Z'),
    );

    expect(snapshot.primaryGym?.id).toBe('gym_1');
    expect(snapshot.activeFeeItemCount).toBe(1);
    expect(snapshot.dashboardStats.totalVisits).toBe(1);
    expect(snapshot.dashboardStats.totalPaid).toBe(630);
    expect(snapshot.range.rangeType).toBe('current_year');
  });

  it('falls back to seeded defaults when settings row is unavailable', async () => {
    (getPrimaryGym as jest.Mock).mockResolvedValue(null);
    (getSettings as jest.Mock).mockResolvedValue(null);
    (listFeeItems as jest.Mock).mockResolvedValue([]);
    (listVisits as jest.Mock).mockResolvedValue([]);

    const snapshot = await getHomeDashboardSnapshot(
      'current_year',
      new Date('2026-04-02T12:00:00.000Z'),
    );

    expect(snapshot.settings).toMatchObject({
      currency: 'CAD',
      defaultGstRate: 0.05,
      defaultPstRate: 0.07,
      locale: 'en-CA',
    });
    expect(snapshot.dashboardStats.totalPaid).toBeNull();
  });
});
