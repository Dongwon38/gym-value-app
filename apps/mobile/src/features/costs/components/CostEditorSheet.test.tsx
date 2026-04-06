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

import { CostEditorSheet } from './CostEditorSheet';

function createLine(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
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
      startDate: '2026-04-04',
      taxMode: 'inherit_default',
    },
    kind: 'starter',
    presetKey: 'membership',
    showAdvanced: false,
    ...overrides,
  };
}

describe('CostEditorSheet', () => {
  it('renders cost type chips and dropdown labels for create flow', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CostEditorSheet
          appSettings={{
            currency: 'CAD',
            defaultGstRate: 0.05,
            defaultPstRate: 0.07,
            locale: 'en-CA',
          }}
          line={createLine()}
          onChangeField={jest.fn()}
          onClose={jest.fn()}
          onDelete={jest.fn()}
          onSave={jest.fn()}
          onSelectKind={jest.fn()}
          saveFeedback={null}
          saveState="idle"
          showKindSelector
          validationErrors={undefined}
          visible
        />,
      );
      await Promise.resolve();
    });

    const tree = JSON.stringify(renderer!.toJSON());

    expect(tree).toContain('Membership');
    expect(tree).toContain('Signup Fee');
    expect(tree).toContain('Annual Fee');
    expect(tree).toContain('Locker Fee');
    expect(tree).toContain('Custom');
    expect(tree).toContain('Bi-weekly');
    expect(tree).toContain('Pre-tax');
    expect(tree).not.toContain('Category');
  });

  it('shows Name input only for custom cost lines', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CostEditorSheet
          appSettings={{
            currency: 'CAD',
            defaultGstRate: 0.05,
            defaultPstRate: 0.07,
            locale: 'en-CA',
          }}
          line={createLine({
            draftId: 'custom_1',
            formValues: {
              amountPreTax: '',
              amountInputMode: 'pre_tax',
              billingAnchorDate: '',
              cadence: 'monthly',
              category: 'other',
              endDate: '',
              gstRate: '',
              isActive: true,
              label: '',
              pstRate: '',
              startDate: '2026-04-04',
              taxMode: 'inherit_default',
            },
            kind: 'custom',
            presetKey: null,
          })}
          onChangeField={jest.fn()}
          onClose={jest.fn()}
          onDelete={jest.fn()}
          onSave={jest.fn()}
          onSelectKind={jest.fn()}
          saveFeedback={null}
          saveState="idle"
          showKindSelector
          validationErrors={undefined}
          visible
        />,
      );
      await Promise.resolve();
    });

    const tree = JSON.stringify(renderer!.toJSON());

    expect(tree).toContain('Name');
    expect(tree).toContain('Custom cost');
  });
});
