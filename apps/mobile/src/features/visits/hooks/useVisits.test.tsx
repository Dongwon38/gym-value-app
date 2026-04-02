jest.mock('../useCases/visits', () => ({
  getVisits: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { getVisits } from '../useCases/visits';
import { useVisits } from './useVisits';

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

let latestHookState: ReturnType<typeof useVisits> | null = null;

function HookHarness() {
  latestHookState = useVisits();
  return null;
}

async function flushEffects() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('useVisits', () => {
  afterEach(() => {
    latestHookState = null;
    jest.clearAllMocks();
  });

  it('loads visits and refreshes them on demand', async () => {
    (getVisits as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createVisit()]);

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HookHarness />);
      await flushEffects();
    });

    expect(latestHookState?.loadState).toBe('ready');
    expect(latestHookState?.visits).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      await latestHookState?.reload();
      await flushEffects();
    });

    expect(getVisits).toHaveBeenCalledTimes(2);
    expect(latestHookState?.visits).toHaveLength(1);
  });

  it('captures query failures for the retry surface', async () => {
    (getVisits as jest.Mock).mockRejectedValue(new Error('visit query failed'));

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HookHarness />);
      await flushEffects();
    });

    expect(latestHookState?.loadState).toBe('error');
    expect(latestHookState?.loadError).toBe('visit query failed');
  });
});
