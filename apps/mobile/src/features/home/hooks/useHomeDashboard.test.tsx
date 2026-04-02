jest.mock('../useCases/dashboard', () => ({
  getHomeDashboardSnapshot: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { getHomeDashboardSnapshot } from '../useCases/dashboard';
import { useHomeDashboard } from './useHomeDashboard';

let latestHookState: ReturnType<typeof useHomeDashboard> | null = null;

function HookHarness() {
  latestHookState = useHomeDashboard();
  return null;
}

async function flushEffects() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('useHomeDashboard', () => {
  afterEach(() => {
    latestHookState = null;
    jest.clearAllMocks();
  });

  it('loads the dashboard snapshot and refreshes on demand', async () => {
    (getHomeDashboardSnapshot as jest.Mock)
      .mockResolvedValueOnce({
        activeFeeItemCount: 0,
        dashboardStats: {
          costPerVisit: null,
          totalVisits: 0,
        },
        primaryGym: null,
        range: {
          endDate: '2026-12-31',
          rangeType: 'current_year',
          startDate: '2026-01-01',
        },
        settings: {
          currency: 'CAD',
          locale: 'en-CA',
        },
        totalSavedVisits: 0,
      })
      .mockResolvedValueOnce({
        activeFeeItemCount: 1,
        dashboardStats: {
          costPerVisit: 17.85,
          totalVisits: 40,
        },
        primaryGym: { id: 'gym_1', name: 'Downtown Gym' },
        range: {
          endDate: '2026-12-31',
          rangeType: 'current_year',
          startDate: '2026-01-01',
        },
        settings: {
          currency: 'CAD',
          locale: 'en-CA',
        },
        totalSavedVisits: 40,
      });

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HookHarness />);
      await flushEffects();
    });

    expect(latestHookState?.loadState).toBe('ready');
    expect(latestHookState?.snapshot?.dashboardStats.totalVisits).toBe(0);

    await ReactTestRenderer.act(async () => {
      latestHookState?.reload();
      await flushEffects();
    });

    expect(getHomeDashboardSnapshot).toHaveBeenCalledTimes(2);
    expect(latestHookState?.snapshot?.dashboardStats.costPerVisit).toBe(17.85);
  });

  it('captures dashboard query failures for the retry surface', async () => {
    (getHomeDashboardSnapshot as jest.Mock).mockRejectedValue(
      new Error('home dashboard query failed'),
    );

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HookHarness />);
      await flushEffects();
    });

    expect(latestHookState?.loadState).toBe('error');
    expect(latestHookState?.loadError).toBe('home dashboard query failed');
  });
});
