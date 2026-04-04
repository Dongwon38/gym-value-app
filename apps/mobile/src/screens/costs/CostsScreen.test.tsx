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
      hasPrimaryGym: true,
      primaryGym: { id: 'gym_1', name: 'Downtown Gym' },
      removeCustomLine: jest.fn(),
      restoreCostItem: jest.fn(),
      save: jest.fn(),
      saveFeedback: null,
      saveState: 'idle',
      setLineEnabled: jest.fn(),
      setLineFieldValue: jest.fn(),
      starterLines: [
        {
          draftId: 'starter_membership',
          enabled: false,
          existingFeeItemId: null,
          existingSortOrder: null,
          formValues: {
            amountPreTax: '',
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('Starter cost setup');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Membership');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Add Custom Cost Line');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Save Cost Setup');
  });

  it('renders inactive history rows separately from the setup form', async () => {
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('Inactive cost history');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Monthly membership');
    expect(JSON.stringify(renderer!.toJSON())).toContain('$59.99');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Restore to setup');
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
});
