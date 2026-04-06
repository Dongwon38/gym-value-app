jest.mock('../../features/visits/hooks/useVisits', () => ({
  useVisits: jest.fn(),
}));

jest.mock('../../features/visits/hooks/useVisitForm', () => ({
  useVisitForm: jest.fn(),
}));

jest.mock('../../features/visits/useCases/cancelVisit', () => ({
  cancelVisit: jest.fn(),
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
    useSafeAreaInsets: () => ({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { useIsFocused } from '@react-navigation/native';
import { useVisitForm } from '../../features/visits/hooks/useVisitForm';
import { useVisits } from '../../features/visits/hooks/useVisits';
import { VisitsScreen } from './VisitsScreen';

function createVisit(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    confidence: 'high',
    createdAt: '2026-04-03T18:10:00-07:00',
    durationMinutes: 75,
    endedAt: '2026-04-03T19:25:00-07:00',
    gymId: 'gym_1',
    id: 'visit_1',
    notes: 'Upper body',
    source: 'manual',
    startedAt: '2026-04-03T18:10:00-07:00',
    status: 'completed',
    updatedAt: '2026-04-03T19:25:00.000Z',
    ...overrides,
  };
}

describe('VisitsScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function mockClosedEditor(overrides: Partial<Record<string, unknown>> = {}) {
    (useVisitForm as jest.Mock).mockReturnValue({
      activeVisit: null,
      closeEditor: jest.fn(),
      derivedDurationMinutes: null,
      editingVisit: null,
      editorMode: 'closed',
      errors: [],
      formValues: {
        date: '2026-04-03',
        endedAt: '19:25',
        gymId: 'gym_1',
        notes: '',
        startedAt: '18:10',
        status: 'completed',
      },
      hasPrimaryGym: true,
      markVisitCancelled: jest.fn(),
      primaryGym: { id: 'gym_1', name: 'Downtown Gym' },
      reloadContext: jest.fn(),
      save: jest.fn(),
      saveFeedback: null,
      saveState: 'idle',
      setFieldValue: jest.fn(),
      startCreate: jest.fn(),
      startEdit: jest.fn(),
      ...overrides,
    });
  }

  it('renders the refreshed visit timeline', async () => {
    mockClosedEditor();
    (useVisits as jest.Mock).mockReturnValue({
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('Month');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Year');
    expect(JSON.stringify(renderer!.toJSON())).not.toContain('All');
    expect(JSON.stringify(renderer!.toJSON())).toContain('04/03');
    expect(JSON.stringify(renderer!.toJSON())).toContain('18:10 - 19:25');
    expect(JSON.stringify(renderer!.toJSON())).toContain('1 hr 15 min');
    expect(JSON.stringify(renderer!.toJSON())).toContain('2026');
    expect(JSON.stringify(renderer!.toJSON())).toContain('1 visit in 2026');
  });

  it('renders the primary gym empty state when nothing can be added yet', async () => {
    mockClosedEditor({
      hasPrimaryGym: false,
      primaryGym: null,
    });
    (useVisits as jest.Mock).mockReturnValue({
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('Primary gym required');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Open Settings');
  });

  it('renders the quick edit sheet when the editor is open', async () => {
    mockClosedEditor({
      derivedDurationMinutes: 75,
      editorMode: 'edit',
      editingVisit: createVisit(),
      saveFeedback: 'Visit updated.',
      saveState: 'success',
    });
    (useVisits as jest.Mock).mockReturnValue({
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('Edit Visit');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Duration');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Manual');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Delete Visit');
  });

  it('reloads visits and context when the screen regains focus', async () => {
    const reload = jest.fn();
    const reloadContext = jest.fn();

    (useIsFocused as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    mockClosedEditor({ reloadContext });
    (useVisits as jest.Mock).mockReturnValue({
      loadError: null,
      loadState: 'ready',
      reload,
      visits: [createVisit()],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<VisitsScreen />);
      await Promise.resolve();
    });

    expect(reload).not.toHaveBeenCalled();
    expect(reloadContext).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer!.update(<VisitsScreen />);
      await Promise.resolve();
    });

    expect(reload).toHaveBeenCalledTimes(1);
    expect(reloadContext).toHaveBeenCalledTimes(1);
  });
});
