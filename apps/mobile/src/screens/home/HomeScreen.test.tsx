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
    activeVisit: null,
    currentMonthVisitCount: 2,
    dashboardStats: {
      activeVisitId: undefined,
      averageVisitLengthMinutes: 77,
      costPerActiveDay: 35.7,
      costPerHour: 23.73,
      costPerVisit: 30.5,
      hasActiveVisit: false,
      latestVisitAt: '2026-04-03T18:00:00-07:00',
      rangeType: 'current_year',
      totalDurationHours: 25.7,
      totalDurationMinutes: 1542,
      totalPaid: 610,
      totalVisits: 20,
      uniqueVisitDays: 12,
    },
    primaryGym: { id: 'gym_1', name: 'GoodLife Fitness' },
    range: {
      endDate: '2026-12-31',
      rangeType: 'current_year',
      startDate: '2026-01-01',
    },
    settings: {
      currency: 'CAD',
      locale: 'en-CA',
    },
    totalSavedVisits: 20,
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

  it('renders the refreshed dashboard layout when data is available', async () => {
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('Gym Value');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Your gym value');
    expect(JSON.stringify(renderer!.toJSON())).toContain('$30.50');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Visits YTD');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Total hours');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Total spent');
    expect(JSON.stringify(renderer!.toJSON())).toContain('This month');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Avg duration');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Recent visit');
  });

  it('renders the active visit card when an active visit exists', async () => {
    (useHomeDashboard as jest.Mock).mockReturnValue({
      loadError: null,
      loadState: 'ready',
      reload: jest.fn(),
      snapshot: createSnapshot({
        activeVisit: {
          id: 'visit_1',
          startedAt: '2026-04-04T08:00:00-07:00',
        },
        dashboardStats: {
          activeVisitId: 'visit_1',
          averageVisitLengthMinutes: 77,
          costPerActiveDay: 35.7,
          costPerHour: 23.73,
          costPerVisit: 30.5,
          hasActiveVisit: true,
          latestVisitAt: '2026-04-03T18:00:00-07:00',
          rangeType: 'current_year',
          totalDurationHours: 25.7,
          totalDurationMinutes: 1542,
          totalPaid: 610,
          totalVisits: 20,
          uniqueVisitDays: 12,
        },
      }),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('Active Visit');
    expect(JSON.stringify(renderer!.toJSON())).toContain('GoodLife Fitness');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Open Visits');
  });

  it('renders the cost CTA when no active cost item exists', async () => {
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('Add costs');
    expect(JSON.stringify(renderer!.toJSON())).toContain('No active costs yet');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Open Costs');
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
