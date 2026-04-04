import {
  emptyFeeItemFormValues,
  emptyGymFormValues,
  emptyVisitFormValues,
} from '../../domain/forms';

import {
  getValidationErrors,
  getValidationWarnings,
  hasValidationErrors,
  validateFeeItemForm,
  validateGymForm,
  validateVisitForm,
} from './index';

describe('validateGymForm', () => {
  it('accepts a valid manual gym setup payload', () => {
    const result = validateGymForm({
      ...emptyGymFormValues,
      latitude: '49.2827',
      longitude: '-123.1207',
      name: 'Downtown Gym',
      radiusMeters: '150',
      timezone: 'America/Vancouver',
    });

    expect(hasValidationErrors(result)).toBe(false);
  });

  it('rejects invalid coordinates, radius, and timezone', () => {
    const result = validateGymForm({
      ...emptyGymFormValues,
      latitude: '91',
      longitude: '-200',
      name: '',
      radiusMeters: '12',
      timezone: 'Invalid/Timezone',
    });

    expect(getValidationErrors(result)).toHaveLength(5);
  });
});

describe('validateFeeItemForm', () => {
  it('accepts a valid monthly fee item payload', () => {
    const result = validateFeeItemForm({
      ...emptyFeeItemFormValues,
      amountPreTax: '49.99',
      cadence: 'monthly',
      category: 'monthly_membership',
      label: 'Membership',
      startDate: '2026-01-01',
      taxMode: 'inherit_default',
    });

    expect(hasValidationErrors(result)).toBe(false);
  });

  it('accepts a valid bi-weekly no-tax fee item with billing anchor date', () => {
    const result = validateFeeItemForm({
      ...emptyFeeItemFormValues,
      amountPreTax: '49.99',
      amountInputMode: 'tax_exempt',
      billingAnchorDate: '2026-01-15',
      cadence: 'bi_weekly',
      category: 'monthly_membership',
      label: 'Membership',
      startDate: '2026-01-01',
      taxMode: 'none',
    });

    expect(hasValidationErrors(result)).toBe(false);
  });

  it('rejects invalid amount, dates, and missing custom tax rates', () => {
    const result = validateFeeItemForm({
      ...emptyFeeItemFormValues,
      amountPreTax: '-1',
      amountInputMode: 'custom',
      cadence: '',
      category: '',
      endDate: '2026-01-01',
      gstRate: '',
      label: '',
      pstRate: '',
      startDate: '2026-02-01',
      taxMode: 'custom',
    });

    expect(getValidationErrors(result).map(issue => issue.field)).toEqual(
      expect.arrayContaining([
        'amountPreTax',
        'cadence',
        'category',
        'endDate',
        'label',
        'taxMode',
      ]),
    );
  });

  it('rejects invalid billing anchor date format', () => {
    const result = validateFeeItemForm({
      ...emptyFeeItemFormValues,
      amountPreTax: '49.99',
      billingAnchorDate: '2026-99-99',
      cadence: 'annual',
      category: 'annual_fee',
      label: 'Annual fee',
      startDate: '2026-01-01',
      taxMode: 'inherit_default',
    });

    expect(getValidationErrors(result).map(issue => issue.field)).toEqual(
      expect.arrayContaining(['billingAnchorDate']),
    );
  });

  it('rejects an invalid amount input mode', () => {
    const result = validateFeeItemForm({
      ...emptyFeeItemFormValues,
      amountInputMode: 'custom_mode' as never,
      amountPreTax: '49.99',
      category: 'monthly_membership',
      label: 'Membership',
      startDate: '2026-01-01',
    });

    expect(getValidationErrors(result).map(issue => issue.field)).toEqual(
      expect.arrayContaining(['amountInputMode']),
    );
  });
});

describe('validateVisitForm', () => {
  const now = new Date('2026-04-02T10:00:00');

  it('accepts a valid completed visit payload', () => {
    const result = validateVisitForm(
      {
        ...emptyVisitFormValues,
        date: '2026-04-01',
        endedAt: '08:30',
        gymId: 'gym_1',
        startedAt: '07:00',
      },
      { now },
    );

    expect(hasValidationErrors(result)).toBe(false);
    expect(getValidationWarnings(result)).toHaveLength(0);
  });

  it('rejects completed visits with future or reversed times', () => {
    const result = validateVisitForm(
      {
        ...emptyVisitFormValues,
        date: '2026-04-03',
        endedAt: '09:00',
        gymId: '',
        startedAt: '10:00',
      },
      { now },
    );

    expect(getValidationErrors(result).map(issue => issue.field)).toEqual(
      expect.arrayContaining(['gymId', 'startedAt', 'endedAt']),
    );
  });

  it('warns on very long visits and blocks duplicate active visits', () => {
    const activeResult = validateVisitForm(
      {
        ...emptyVisitFormValues,
        date: '2026-04-02',
        endedAt: '',
        gymId: 'gym_1',
        startedAt: '06:00',
        status: 'active',
      },
      {
        existingActiveVisits: 1,
        now,
      },
    );

    expect(getValidationErrors(activeResult).map(issue => issue.field)).toEqual(
      expect.arrayContaining(['status']),
    );

    const longVisitResult = validateVisitForm(
      {
        ...emptyVisitFormValues,
        date: '2026-04-01',
        endedAt: '20:30',
        gymId: 'gym_1',
        startedAt: '07:00',
      },
      { now },
    );

    expect(getValidationWarnings(longVisitResult).map(issue => issue.field)).toEqual(
      expect.arrayContaining(['endedAt']),
    );
  });
});
