import {
  buildCostSetupDraftState,
  getCostSetupLinePreview,
  restoreCostItemToDraftState,
} from './costSetup';

function createFeeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    amountPreTax: 59.99,
    billingAnchorDate: null,
    cadence: 'monthly',
    category: 'monthly_membership',
    createdAt: '2026-04-02T10:00:00.000Z',
    endDate: null,
    gstRate: null,
    gymId: 'gym_1',
    id: 'fee_1',
    isActive: true,
    label: 'Monthly membership',
    pstRate: null,
    sortOrder: 0,
    startDate: '2026-04-01',
    taxMode: 'inherit_default',
    updatedAt: '2026-04-02T10:00:00.000Z',
    ...overrides,
  };
}

describe('costSetup', () => {
  it('always returns the four starter lines even when no fee items exist', () => {
    const draftState = buildCostSetupDraftState([]);

    expect(draftState.starterLines).toHaveLength(4);
    expect(draftState.starterLines.map(line => line.presetKey)).toEqual([
      'membership',
      'signup',
      'annual',
      'locker',
    ]);
    expect(draftState.starterLines.every(line => line.enabled === false)).toBe(true);
    expect(draftState.customLines).toHaveLength(0);
  });

  it('hydrates matching active rows into starter lines and leaves extras as custom lines', () => {
    const draftState = buildCostSetupDraftState([
      createFeeItem({
        cadence: 'bi_weekly',
        id: 'fee_membership',
        label: 'Bi-weekly membership',
      }),
      createFeeItem({
        category: 'signup_fee',
        id: 'fee_signup',
        label: 'Signup fee',
      }),
      createFeeItem({
        category: 'other',
        id: 'fee_parking',
        label: 'Parking',
      }),
    ]);

    expect(
      draftState.starterLines.find(line => line.presetKey === 'membership')?.existingFeeItemId,
    ).toBe('fee_membership');
    expect(
      draftState.starterLines.find(line => line.presetKey === 'signup')?.existingFeeItemId,
    ).toBe('fee_signup');
    expect(draftState.customLines).toHaveLength(1);
    expect(draftState.customLines[0].formValues.label).toBe('Parking');
  });

  it('builds an after-tax preview from the current app tax defaults', () => {
    const draftState = buildCostSetupDraftState([]);
    const preview = getCostSetupLinePreview(
      {
        formValues: {
          ...draftState.starterLines[0].formValues,
          amountPreTax: '100',
        },
      },
      {
        currency: 'CAD',
        defaultGstRate: 0.05,
        defaultPstRate: 0.07,
        locale: 'en-CA',
      },
    );

    expect(preview).toMatchObject({
      preTaxAmount: 100,
      totalAmount: 112,
      totalTaxAmount: 12,
    });
  });

  it('builds a pre-tax preview from a post-tax entered amount', () => {
    const draftState = buildCostSetupDraftState([]);
    const preview = getCostSetupLinePreview(
      {
        formValues: {
          ...draftState.starterLines[0].formValues,
          amountInputMode: 'post_tax',
          amountPreTax: '112',
        },
      },
      {
        currency: 'CAD',
        defaultGstRate: 0.05,
        defaultPstRate: 0.07,
        locale: 'en-CA',
      },
    );

    expect(preview).toMatchObject({
      preTaxAmount: 100,
      totalAmount: 112,
      totalTaxAmount: 12,
    });
  });

  it('restores an inactive starter-category row back into the matching starter line', () => {
    const draftState = buildCostSetupDraftState([]);
    const restoredState = restoreCostItemToDraftState(
      draftState,
      createFeeItem({
        category: 'annual_fee',
        id: 'fee_annual',
        isActive: false,
        label: 'Annual fee',
      }),
    );

    const annualLine = restoredState.starterLines.find(
      line => line.presetKey === 'annual',
    );

    expect(annualLine).toMatchObject({
      enabled: true,
      existingFeeItemId: 'fee_annual',
    });
    expect(annualLine?.showAdvanced).toBe(true);
  });

  it('restores an inactive custom row into the custom line collection', () => {
    const draftState = buildCostSetupDraftState([]);
    const restoredState = restoreCostItemToDraftState(
      draftState,
      createFeeItem({
        category: 'other',
        id: 'fee_parking',
        isActive: false,
        label: 'Parking',
      }),
    );

    expect(restoredState.customLines).toHaveLength(1);
    expect(restoredState.customLines[0]).toMatchObject({
      enabled: true,
      existingFeeItemId: 'fee_parking',
      kind: 'custom',
    });
  });
});
