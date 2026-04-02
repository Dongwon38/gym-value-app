import {
  defaultAppSettingsId,
  defaultAppSettingsValues,
  defaultDashboardRangeType,
  feeItemAmountPreTaxLimits,
  feeItemTaxRateLimits,
  gymRadiusMetersLimits,
  maxActiveVisits,
  visitDurationMinutesLimits,
} from './index';
import {
  dashboardRangeTypes,
  feeItemCadences,
  feeItemCadencesForV01,
  feeItemCategories,
  feeItemTaxModes,
  homePrimaryMetrics,
  visitConfidences,
  visitSources,
  visitStatuses,
} from '../models';

describe('domain constants', () => {
  it('matches the documented enum values for visits, fee items, and dashboard stats', () => {
    expect(visitStatuses).toEqual(['active', 'completed', 'cancelled']);
    expect(visitSources).toEqual(['manual', 'prompted', 'recovered']);
    expect(visitConfidences).toEqual(['high', 'medium', 'low']);
    expect(feeItemCategories).toEqual([
      'monthly_membership',
      'annual_fee',
      'signup_fee',
      'locker_fee',
      'pt',
      'other',
    ]);
    expect(feeItemCadences).toEqual([
      'one_time',
      'monthly',
      'annual',
      'custom',
    ]);
    expect(feeItemCadencesForV01).toEqual([
      'one_time',
      'monthly',
      'annual',
    ]);
    expect(feeItemTaxModes).toEqual(['inherit_default', 'custom']);
    expect(homePrimaryMetrics).toEqual(['cost_per_visit']);
    expect(dashboardRangeTypes).toEqual([
      'current_year',
      'current_month',
      'all_time',
    ]);
  });

  it('matches the documented defaults and limits for v0.1 foundation work', () => {
    expect(defaultAppSettingsId).toBe('default');
    expect(defaultDashboardRangeType).toBe('current_year');
    expect(defaultAppSettingsValues).toEqual({
      checkinSuggestionsEnabled: true,
      checkoutSuggestionsEnabled: true,
      currency: 'CAD',
      defaultGstRate: 0.05,
      defaultPstRate: 0.07,
      homePrimaryMetric: 'cost_per_visit',
      locale: 'en-CA',
      regionPreset: 'BC_CA',
    });
    expect(gymRadiusMetersLimits).toEqual({ min: 30, max: 500 });
    expect(visitDurationMinutesLimits).toEqual({ minCompleted: 1 });
    expect(feeItemAmountPreTaxLimits).toEqual({ min: 0 });
    expect(feeItemTaxRateLimits).toEqual({ min: 0 });
    expect(maxActiveVisits).toBe(1);
  });
});
