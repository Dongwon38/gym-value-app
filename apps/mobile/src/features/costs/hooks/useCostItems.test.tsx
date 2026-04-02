jest.mock('../useCases/costItems', () => ({
  getCostItems: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { getCostItems } from '../useCases/costItems';
import { useCostItems } from './useCostItems';

function createFeeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    amountPreTax: 59.99,
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

let latestHookState: ReturnType<typeof useCostItems> | null = null;

function HookHarness() {
  latestHookState = useCostItems();
  return null;
}

async function flushEffects() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('useCostItems', () => {
  afterEach(() => {
    latestHookState = null;
    jest.clearAllMocks();
  });

  it('loads cost items and refreshes them on demand', async () => {
    (getCostItems as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createFeeItem()]);

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HookHarness />);
      await flushEffects();
    });

    expect(latestHookState?.loadState).toBe('ready');
    expect(latestHookState?.costItems).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      latestHookState?.reload();
      await flushEffects();
    });

    expect(getCostItems).toHaveBeenCalledTimes(2);
    expect(latestHookState?.loadState).toBe('ready');
    expect(latestHookState?.costItems).toHaveLength(1);
    expect(latestHookState?.activeCount).toBe(1);
  });

  it('captures query failures for the retry surface', async () => {
    (getCostItems as jest.Mock).mockRejectedValue(
      new Error('fee item query failed'),
    );

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HookHarness />);
      await flushEffects();
    });

    expect(latestHookState?.loadState).toBe('error');
    expect(latestHookState?.loadError).toBe('fee item query failed');
  });
});
