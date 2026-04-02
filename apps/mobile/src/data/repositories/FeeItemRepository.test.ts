jest.mock('../db', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../db';
import {
  createFeeItem,
  listFeeItems,
  setFeeItemActiveState,
  updateFeeItem,
} from './FeeItemRepository';

function createFeeItemRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    amount_pre_tax: 59.99,
    cadence: 'monthly',
    category: 'monthly_membership',
    created_at: '2026-04-02T10:00:00.000Z',
    end_date: null,
    gst_rate: null,
    gym_id: 'gym_1',
    id: 'fee_1',
    is_active: 1,
    label: 'Monthly membership',
    pst_rate: null,
    sort_order: 0,
    start_date: '2026-04-01',
    tax_mode: 'inherit_default',
    updated_at: '2026-04-02T10:00:00.000Z',
    ...overrides,
  };
}

describe('FeeItemRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a fee item and assigns the next sort order for the gym', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({
        rows: {
          item: () => ({ next_sort_order: 3 }),
        },
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: {
          item: () => createFeeItemRow({ id: 'fee_3', sort_order: 3 }),
        },
      });
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const savedCostItem = await createFeeItem({
      amountPreTax: 25,
      cadence: 'one_time',
      category: 'signup_fee',
      gymId: 'gym_1',
      label: 'Sign-up',
      startDate: '2026-04-01',
      taxMode: 'inherit_default',
    });

    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('MAX(sort_order)'),
      ['gym_1'],
    );
    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO fee_items'),
      expect.arrayContaining([
        expect.stringMatching(/^fee_/),
        'gym_1',
        'signup_fee',
        'Sign-up',
        25,
        'one_time',
        '2026-04-01',
        null,
        'inherit_default',
        null,
        null,
        1,
        3,
      ]),
    );
    expect(savedCostItem.sortOrder).toBe(3);
  });

  it('updates an existing fee item in place', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({
        rows: {
          item: () =>
            createFeeItemRow({
              amount_pre_tax: 79.99,
              id: 'fee_1',
              label: 'Premium membership',
            }),
        },
      });
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const savedCostItem = await updateFeeItem('fee_1', {
      amountPreTax: 79.99,
      cadence: 'monthly',
      category: 'monthly_membership',
      gymId: 'gym_1',
      isActive: true,
      label: 'Premium membership',
      sortOrder: 2,
      startDate: '2026-04-01',
      taxMode: 'inherit_default',
    });

    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE fee_items'),
      [
        'gym_1',
        'monthly_membership',
        'Premium membership',
        79.99,
        'monthly',
        '2026-04-01',
        null,
        'inherit_default',
        null,
        null,
        1,
        2,
        expect.any(String),
        'fee_1',
      ],
    );
    expect(savedCostItem.label).toBe('Premium membership');
  });

  it('marks a fee item inactive without removing the row', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({
        rows: {
          item: () => createFeeItemRow({ id: 'fee_1', is_active: 0 }),
        },
      });
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const savedCostItem = await setFeeItemActiveState('fee_1', false);

    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SET'),
      [0, expect.any(String), 'fee_1'],
    );
    expect(savedCostItem.isActive).toBe(false);
  });

  it('lists fee items in active-first order', async () => {
    const executeAsync = jest.fn().mockResolvedValue({
      rows: {
        _array: [
          createFeeItemRow(),
          createFeeItemRow({
            amount_pre_tax: 25,
            category: 'locker_fee',
            id: 'fee_2',
            is_active: 0,
            label: 'Locker rental',
            sort_order: 1,
          }),
        ],
        item: () => undefined,
        length: 2,
      },
    });

    (getDatabase as jest.Mock).mockReturnValue({ executeAsync });

    const costItems = await listFeeItems();

    expect(executeAsync).toHaveBeenCalledWith(
      expect.stringContaining(
        'ORDER BY is_active DESC, sort_order ASC, created_at DESC',
      ),
    );
    expect(costItems).toHaveLength(2);
    expect(costItems[0]?.isActive).toBe(true);
    expect(costItems[0]?.amountPreTax).toBe(59.99);
    expect(costItems[1]?.id).toBe('fee_2');
    expect(costItems[1]?.isActive).toBe(false);
  });
});
