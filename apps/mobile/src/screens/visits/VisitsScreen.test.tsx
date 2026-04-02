jest.mock('../../features/visits/hooks/useVisits', () => ({
  useVisits: jest.fn(),
}));

jest.mock('../../features/visits/useCases/visits', () => ({
  formatVisitDuration: jest.fn(() => '1 hr'),
  formatVisitStatus: jest.fn(() => 'Completed'),
  formatVisitWindow: jest.fn(() => '2026-04-02 10:00 to 11:00'),
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

import { useVisits } from '../../features/visits/hooks/useVisits';
import { VisitsScreen } from './VisitsScreen';

function createVisit(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    confidence: 'high',
    createdAt: '2026-04-02T10:00:00.000Z',
    durationMinutes: 60,
    endedAt: '2026-04-02T11:00:00.000Z',
    gymId: 'gym_1',
    id: 'visit_1',
    notes: 'Upper body',
    source: 'manual',
    startedAt: '2026-04-02T10:00:00.000Z',
    status: 'completed',
    updatedAt: '2026-04-02T11:00:00.000Z',
    ...overrides,
  };
}

describe('VisitsScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the empty state when no visits exist', async () => {
    (useVisits as jest.Mock).mockReturnValue({
      activeCount: 0,
      loadError: null,
      loadState: 'ready',
      reload: jest.fn(),
      visits: [],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<VisitsScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('No visits saved yet');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Open Visit Entry');
  });

  it('renders saved visit rows when visits exist', async () => {
    (useVisits as jest.Mock).mockReturnValue({
      activeCount: 0,
      loadError: null,
      loadState: 'ready',
      reload: jest.fn(),
      visits: [createVisit()],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<VisitsScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('Upper body');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Completed');
    expect(JSON.stringify(renderer!.toJSON())).toContain('1 hr');
  });
});
