jest.mock('../../features/costs/hooks/useCostItems', () => ({
  useCostItems: jest.fn(),
}));

jest.mock('../../features/costs/hooks/useCostItemForm', () => ({
  useCostItemForm: jest.fn(),
}));

jest.mock('../../features/costs/useCases/costItems', () => ({
  formatCostItemAmount: jest.fn(() => '$59.99'),
  formatCostItemCadence: jest.fn(() => 'Monthly'),
  formatCostItemCategory: jest.fn(() => 'Monthly membership'),
  formatCostItemDateRange: jest.fn(() => 'Starts 2026-04-01'),
}));

jest.mock('../../features/costs/useCases/deactivateCostItem', () => ({
  deactivateCostItem: jest.fn(),
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
import { useCostItemForm } from '../../features/costs/hooks/useCostItemForm';
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

  function mockClosedEditor() {
    (useCostItemForm as jest.Mock).mockReturnValue({
      closeEditor: jest.fn(),
      editorMode: 'closed',
      editingCostItem: null,
      errors: [],
      formValues: null,
      hasPrimaryGym: true,
      primaryGym: { id: 'gym_1', name: 'Downtown Gym' },
      save: jest.fn(),
      saveFeedback: null,
      saveState: 'idle',
      setFieldValue: jest.fn(),
      startCreate: jest.fn(),
      startEdit: jest.fn(),
    });
  }

  it('renders the empty state when no cost items exist', async () => {
    mockClosedEditor();
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('No cost items saved yet');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Add Cost Item');
  });

  it('renders saved cost rows when items exist', async () => {
    mockClosedEditor();
    (useCostItems as jest.Mock).mockReturnValue({
      activeCount: 1,
      costItems: [createFeeItem()],
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('Monthly membership');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Active');
    expect(JSON.stringify(renderer!.toJSON())).toContain('$59.99');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Edit Cost Item');
    expect(JSON.stringify(renderer!.toJSON())).toContain('Delete Cost Item');
  });

  it('renders inactive history guidance for inactive cost rows', async () => {
    mockClosedEditor();
    (useCostItems as jest.Mock).mockReturnValue({
      activeCount: 0,
      costItems: [createFeeItem({ id: 'fee_2', isActive: false })],
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

    expect(JSON.stringify(renderer!.toJSON())).toContain('Inactive');
    expect(JSON.stringify(renderer!.toJSON())).toContain(
      'Inactive items stay visible for history',
    );
  });
});
