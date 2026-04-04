jest.mock('../../features/costs/hooks/useCostItems', () => ({
  useCostItems: jest.fn(),
}));

jest.mock('../../features/costs/hooks/useCostSetupForm', () => ({
  useCostSetupForm: jest.fn(),
}));

jest.mock('../../features/costs/useCases/costItems', () => ({
  formatCostItemAmount: jest.fn(() => '$59.99'),
  formatCostItemCadence: jest.fn(() => 'Monthly'),
  formatCostItemCategory: jest.fn(() => 'Monthly membership'),
  formatCostItemDateRange: jest.fn(() => 'Starts 2026-04-01'),
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
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
import { useCostItems } from '../../features/costs/hooks/useCostItems';
import { useCostSetupForm } from '../../features/costs/hooks/useCostSetupForm';
import { CostsScreen } from './CostsScreen';

function createFeeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    amountPreTax: 59.99,
    billingAnchorDate: null,
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

describe('CostsScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function mockCostSetupForm() {
    (useCostSetupForm as jest.Mock).mockReturnValue({
      addCustomLine: jest.fn(),
      appSettings: {
        currency: 'CAD',
        defaultGstRate: 0.05,
        defaultPstRate: 0.07,
        locale: 'en-CA',
      },
      customLines: [],
      deactivateLine: jest.fn(),
      getStarterLineDraftId: jest.fn(() => 'starter_membership'),
      hasPrimaryGym: true,
      primaryGym: { id: 'gym_1', name: 'Downtown Gym' },
      reloadSupport: jest.fn(),
      removeCustomLine: jest.fn(),
      resetDraftState: jest.fn(),
      restoreCostItem: jest.fn(),
      save: jest.fn(),
      saveFeedback: null,
      saveState: 'idle',
      setLineFieldValue: jest.fn(),
      starterLines: [
        {
          draftId: 'starter_membership',
          enabled: false,
          existingFeeItemId: null,
          existingSortOrder: null,
          formValues: {
            amountPreTax: '',
            amountInputMode: 'pre_tax',
            billingAnchorDate: '',
            cadence: 'bi_weekly',
            category: 'monthly_membership',
            endDate: '',
            gstRate: '',
            isActive: true,
            label: 'Membership fee',
            pstRate: '',
            startDate: '2026-04-03',
            taxMode: 'inherit_default',
          },
          kind: 'starter',
          presetKey: 'membership',
          showAdvanced: false,
        },
      ],
      supportError: null,
      supportState: 'ready',
      toggleLineAdvanced: jest.fn(),
      validationErrorsByLine: {},
    });
  }

  it('renders the starter cost setup even when no cost items exist', async () => {
    mockCostSetupForm();
    (useCostItems as jest.Mock).mockReturnValue({
      activeCount: 0,
      costItems: [],
      inactiveCount: 0,
      loadError: null,
      loadState: 'ready',
      reload: jest.fn(),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<CostsScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('Monthly recurring');
    expect(JSON.stringify(renderer!.toJSON())).toContain('No costs yet');
    expect(JSON.stringify(renderer!.toJSON())).toContain(
      'Start with one of the four quick templates, or add a custom line.',
    );
  });

  it('renders active and inactive cost sections separately', async () => {
    mockCostSetupForm();
    (useCostItems as jest.Mock).mockReturnValue({
      activeCount: 1,
      costItems: [createFeeItem(), createFeeItem({ id: 'fee_2', isActive: false })],
      inactiveCount: 1,
      loadError: null,
      loadState: 'ready',
      reload: jest.fn(),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<CostsScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('Monthly recurring');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Monthly membership');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Inactive costs');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Show inactive (1)');
  });

  it('renders the load error surface when the cost query fails', async () => {
    mockCostSetupForm();
    (useCostItems as jest.Mock).mockReturnValue({
      activeCount: 0,
      costItems: [],
      inactiveCount: 0,
      loadError: 'fee item query failed',
      loadState: 'error',
      reload: jest.fn(),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<CostsScreen />);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('Cost list needs attention');
    expect(JSON.stringify(renderer!.toJSON())).toContain('fee item query failed');
  });

  it('reloads cost rows and gym support when the screen regains focus', async () => {
    const reload = jest.fn();
    const reloadSupport = jest.fn();

    (useIsFocused as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    (useCostSetupForm as jest.Mock).mockReturnValue({
      addCustomLine: jest.fn(),
      appSettings: {
        currency: 'CAD',
        defaultGstRate: 0.05,
        defaultPstRate: 0.07,
        locale: 'en-CA',
      },
      customLines: [],
      deactivateLine: jest.fn(),
      getStarterLineDraftId: jest.fn(() => 'starter_membership'),
      hasPrimaryGym: true,
      primaryGym: { id: 'gym_1', name: 'Downtown Gym' },
      reloadSupport,
      removeCustomLine: jest.fn(),
      resetDraftState: jest.fn(),
      restoreCostItem: jest.fn(),
      save: jest.fn(),
      saveFeedback: null,
      saveState: 'idle',
      setLineFieldValue: jest.fn(),
      starterLines: [],
      supportError: null,
      supportState: 'ready',
      toggleLineAdvanced: jest.fn(),
      validationErrorsByLine: {},
    });
    (useCostItems as jest.Mock).mockReturnValue({
      activeCount: 0,
      costItems: [],
      inactiveCount: 0,
      loadError: null,
      loadState: 'ready',
      reload,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<CostsScreen />);
      await Promise.resolve();
    });

    expect(reload).not.toHaveBeenCalled();
    expect(reloadSupport).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer!.update(<CostsScreen />);
      await Promise.resolve();
    });

    expect(reload).toHaveBeenCalledTimes(1);
    expect(reloadSupport).toHaveBeenCalledTimes(1);
  });
});
