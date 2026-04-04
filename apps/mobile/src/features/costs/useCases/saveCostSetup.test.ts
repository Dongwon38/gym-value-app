jest.mock('../../../data/repositories', () => ({
  setFeeItemActiveState: jest.fn(),
}));

jest.mock('./saveCostItem', () => ({
  saveCostItem: jest.fn(),
}));

import { setFeeItemActiveState } from '../../../data/repositories';
import { saveCostItem } from './saveCostItem';
import {
  buildCostSetupDraftState,
  createCustomCostSetupLine,
} from './costSetup';
import {
  CostSetupFormValidationError,
  saveCostSetup,
} from './saveCostSetup';

describe('saveCostSetup', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates only the starter rows that have an amount and skips blank starter lines', async () => {
    const draftState = buildCostSetupDraftState([]);

    draftState.starterLines[0] = {
      ...draftState.starterLines[0],
      enabled: true,
      formValues: {
        ...draftState.starterLines[0].formValues,
        amountPreTax: '44.99',
      },
    };

    const summary = await saveCostSetup(draftState.starterLines, {
      gymId: 'gym_1',
    });

    expect(saveCostItem).toHaveBeenCalledTimes(1);
    expect(summary).toEqual({
      createdCount: 1,
      deactivatedCount: 0,
      skippedCount: 3,
      updatedCount: 0,
    });
  });

  it('marks an existing saved line inactive when it is skipped during save', async () => {
    const draftState = buildCostSetupDraftState([
      {
        amountPreTax: 59.99,
        billingAnchorDate: null,
        cadence: 'monthly',
        category: 'locker_fee',
        createdAt: '2026-04-02T10:00:00.000Z',
        endDate: null,
        gstRate: null,
        gymId: 'gym_1',
        id: 'fee_locker',
        isActive: true,
        label: 'Locker fee',
        pstRate: null,
        sortOrder: 3,
        startDate: '2026-04-01',
        taxMode: 'inherit_default',
        updatedAt: '2026-04-02T10:00:00.000Z',
      },
    ]);

    const lockerLine = draftState.starterLines.find(
      line => line.presetKey === 'locker',
    );

    await saveCostSetup(
      [
        {
          ...lockerLine!,
          enabled: false,
          formValues: {
            ...lockerLine!.formValues,
            amountPreTax: '',
          },
        },
      ],
      { gymId: 'gym_1' },
    );

    expect(setFeeItemActiveState).toHaveBeenCalledWith('fee_locker', false);
  });

  it('fails validation when a custom line has an amount but no label', async () => {
    const customLine = createCustomCostSetupLine({
      formValues: {
        ...createCustomCostSetupLine().formValues,
        amountPreTax: '19.99',
      },
    });

    await expect(
      saveCostSetup([customLine], { gymId: 'gym_1' }),
    ).rejects.toBeInstanceOf(CostSetupFormValidationError);
  });

  it('updates a restored existing row instead of creating a new one', async () => {
    (saveCostItem as jest.Mock).mockResolvedValue({
      id: 'fee_signup',
      label: 'Signup fee',
    });

    const restoredLine = {
      ...buildCostSetupDraftState([]).starterLines[1],
      enabled: true,
      existingFeeItemId: 'fee_signup',
      existingSortOrder: 1,
      formValues: {
        ...buildCostSetupDraftState([]).starterLines[1].formValues,
        amountPreTax: '29.99',
      },
    };

    const summary = await saveCostSetup([restoredLine], { gymId: 'gym_1' });

    expect(saveCostItem).toHaveBeenCalledWith(
      expect.objectContaining({
        amountPreTax: '29.99',
      }),
      {
        existingFeeItem: { id: 'fee_signup', sortOrder: 1 },
        gymId: 'gym_1',
      },
    );
    expect(summary).toEqual({
      createdCount: 0,
      deactivatedCount: 0,
      skippedCount: 0,
      updatedCount: 1,
    });
  });
});
