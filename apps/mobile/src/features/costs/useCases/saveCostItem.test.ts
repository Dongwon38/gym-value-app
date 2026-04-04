jest.mock('../../../data/repositories', () => ({
  createFeeItem: jest.fn(),
  updateFeeItem: jest.fn(),
}));

import { emptyFeeItemFormValues } from '../../../domain/forms';
import { createFeeItem, updateFeeItem } from '../../../data/repositories';
import {
  FeeItemFormValidationError,
  saveCostItem,
} from './saveCostItem';

describe('saveCostItem', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a fee item from valid v0.1 form values', async () => {
    (createFeeItem as jest.Mock).mockResolvedValue({ id: 'fee_1', label: 'Monthly membership' });

    await saveCostItem(
      {
        ...emptyFeeItemFormValues,
        amountPreTax: '59.99',
        cadence: 'monthly',
        category: 'monthly_membership',
        label: 'Monthly membership',
        startDate: '2026-04-01',
      },
      { gymId: 'gym_1' },
    );

    expect(createFeeItem).toHaveBeenCalledWith({
      amountPreTax: 59.99,
      billingAnchorDate: null,
      cadence: 'monthly',
      category: 'monthly_membership',
      endDate: null,
      gstRate: null,
      gymId: 'gym_1',
      isActive: true,
      label: 'Monthly membership',
      pstRate: null,
      sortOrder: undefined,
      startDate: '2026-04-01',
      taxMode: 'inherit_default',
    });
  });

  it('updates an existing fee item and persists custom tax overrides', async () => {
    (updateFeeItem as jest.Mock).mockResolvedValue({ id: 'fee_1', label: 'Locker rental' });

    await saveCostItem(
      {
        ...emptyFeeItemFormValues,
        amountPreTax: '25',
        amountInputMode: 'custom',
        cadence: 'monthly',
        category: 'locker_fee',
        gstRate: '0.05',
        isActive: false,
        label: 'Locker rental',
        pstRate: '0.07',
        startDate: '2026-04-01',
        taxMode: 'custom',
      },
      {
        existingFeeItem: { id: 'fee_1', sortOrder: 4 },
        gymId: 'gym_1',
      },
    );

    expect(updateFeeItem).toHaveBeenCalledWith('fee_1', {
      amountPreTax: 25,
      billingAnchorDate: null,
      cadence: 'monthly',
      category: 'locker_fee',
      endDate: null,
      gstRate: 0.05,
      gymId: 'gym_1',
      isActive: false,
      label: 'Locker rental',
      pstRate: 0.07,
      sortOrder: 4,
      startDate: '2026-04-01',
      taxMode: 'custom',
    });
  });

  it('persists bi-weekly cadence, no-tax mode, and billing anchor date', async () => {
    (createFeeItem as jest.Mock).mockResolvedValue({
      id: 'fee_2',
      label: 'Bi-weekly membership',
    });

    await saveCostItem(
      {
        ...emptyFeeItemFormValues,
        amountPreTax: '44.99',
        amountInputMode: 'tax_exempt',
        billingAnchorDate: '2025-12-31',
        cadence: 'bi_weekly',
        category: 'monthly_membership',
        label: 'Bi-weekly membership',
        startDate: '2026-01-01',
        taxMode: 'none',
      },
      { gymId: 'gym_1' },
    );

    expect(createFeeItem).toHaveBeenCalledWith({
      amountPreTax: 44.99,
      billingAnchorDate: '2025-12-31',
      cadence: 'bi_weekly',
      category: 'monthly_membership',
      endDate: null,
      gstRate: null,
      gymId: 'gym_1',
      isActive: true,
      label: 'Bi-weekly membership',
      pstRate: null,
      sortOrder: undefined,
      startDate: '2026-01-01',
      taxMode: 'none',
    });
  });

  it('converts a post-tax amount back into stored pre-tax using default rates', async () => {
    (createFeeItem as jest.Mock).mockResolvedValue({
      id: 'fee_3',
      label: 'Membership fee',
    });

    await saveCostItem(
      {
        ...emptyFeeItemFormValues,
        amountInputMode: 'post_tax',
        amountPreTax: '112',
        cadence: 'monthly',
        category: 'monthly_membership',
        label: 'Membership fee',
        startDate: '2026-04-01',
      },
      { gymId: 'gym_1' },
    );

    expect(createFeeItem).toHaveBeenCalledWith({
      amountPreTax: 100,
      billingAnchorDate: null,
      cadence: 'monthly',
      category: 'monthly_membership',
      endDate: null,
      gstRate: null,
      gymId: 'gym_1',
      isActive: true,
      label: 'Membership fee',
      pstRate: null,
      sortOrder: undefined,
      startDate: '2026-04-01',
      taxMode: 'inherit_default',
    });
  });

  it('throws a validation error when required cost fields are missing', async () => {
    await expect(
      saveCostItem(
        {
          ...emptyFeeItemFormValues,
          amountPreTax: '',
          category: '',
          label: '',
          startDate: '',
        },
        { gymId: 'gym_1' },
      ),
    ).rejects.toBeInstanceOf(FeeItemFormValidationError);
  });
});
