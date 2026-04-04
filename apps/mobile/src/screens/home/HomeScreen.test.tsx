jest.mock('../../features/home/hooks/useHomeDashboard', () => ({
  useHomeDashboard: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { useIsFocused } from '@react-navigation/native';
import { useHomeDashboard } from '../../features/home/hooks/useHomeDashboard';
import { HomeScreen } from './HomeScreen';

function createSnapshot(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    activeFeeItemCount: 1,
    dashboardStats: {
      activeVisitId: undefined,
      averageVisitLengthMinutes: 80,
      costPerActiveDay: 35.7,
      costPerHour: 13.3875,
      costPerVisit: 17.85,
      hasActiveVisit: false,
      latestVisitAt: '2026-04-02T18:00:00.000Z',
      rangeType: 'current_year',
      totalDurationHours: 53.3333,
      totalDurationMinutes: 3200,
      totalPaid: 714,
      totalVisits: 40,
      uniqueVisitDays: 20,
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
    ...overrides,
  };
}

describe('HomeScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the gym setup empty state when no primary gym exists', async () => {
    (useHomeDashboard as jest.Mock).mockReturnValue({
      loadError: null,
      loadState: 'ready',
      reload: jest.fn(),
      snapshot: createSnapshot({ primaryGym: null }),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('Set up your primary gym');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Open Settings');
  });

  it('renders the cost empty state when no active cost item exists', async () => {
    (useHomeDashboard as jest.Mock).mockReturnValue({
      loadError: null,
      loadState: 'ready',
      reload: jest.fn(),
      snapshot: createSnapshot({
        activeFeeItemCount: 0,
        dashboardStats: {
          averageVisitLengthMinutes: null,
          costPerActiveDay: null,
          costPerHour: null,
          costPerVisit: null,
          hasActiveVisit: false,
          latestVisitAt: undefined,
          rangeType: 'current_year',
          totalDurationHours: 0,
          totalDurationMinutes: 0,
          totalPaid: null,
          totalVisits: 0,
          uniqueVisitDays: 0,
        },
        totalSavedVisits: 0,
      }),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('No active cost items yet');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Go to Costs');
  });

  it('renders the visit empty state when there are no completed visits', async () => {
    (useHomeDashboard as jest.Mock).mockReturnValue({
      loadError: null,
      loadState: 'ready',
      reload: jest.fn(),
      snapshot: createSnapshot({
        dashboardStats: {
          averageVisitLengthMinutes: null,
          costPerActiveDay: null,
          costPerHour: null,
          costPerVisit: null,
          hasActiveVisit: true,
          latestVisitAt: '2026-04-02T18:00:00.000Z',
          rangeType: 'current_year',
          totalDurationHours: 0,
          totalDurationMinutes: 0,
          totalPaid: 714,
          totalVisits: 0,
          uniqueVisitDays: 0,
        },
        totalSavedVisits: 1,
      }),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('No completed visits yet');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Go to Visits');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Active visit in progress');
  });

  it('renders populated KPI cards when metrics are available', async () => {
    (useHomeDashboard as jest.Mock).mockReturnValue({
      loadError: null,
      loadState: 'ready',
      reload: jest.fn(),
      snapshot: createSnapshot(),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('Cost per visit');
    expect(JSON.stringify(renderer!.toJSON())).toContain('$17.85');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Summary metrics');
    expect(JSON.stringify(renderer!.toJSON())).toContain('$714.00');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Latest visit');
  });

  it('reloads the dashboard when the screen regains focus', async () => {
    const reload = jest.fn();

    (useIsFocused as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    (useHomeDashboard as jest.Mock).mockReturnValue({
      loadError: null,
      loadState: 'ready',
      reload,
      snapshot: createSnapshot(),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });

    expect(reload).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer!.update(<HomeScreen />);
      await Promise.resolve();
    });

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
