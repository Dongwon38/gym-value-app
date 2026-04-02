import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeeItemFormValues } from '../../../domain/forms';
import {
  feeItemCadencesForV01,
  feeItemCategories,
  type FeeItemCadenceForV01,
  type FeeItemCategory,
  type FeeItemTaxMode,
} from '../../../domain/models';
import type { ValidationIssue } from '../../../utils/validation';
import { Card, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import {
  formatCostItemCadence,
  formatCostItemCategory,
} from '../useCases/costItems';

type CostItemEditorCardProps = {
  editorMode: 'create' | 'edit';
  formValues: FeeItemFormValues;
  hasPrimaryGym: boolean;
  onClose: () => void;
  onSave: () => void;
  onSetFieldValue: <Field extends keyof FeeItemFormValues>(
    field: Field,
    value: FeeItemFormValues[Field],
  ) => void;
  primaryGymName?: string;
  saveFeedback: string | null;
  saveState: 'idle' | 'saving' | 'success' | 'error';
  validationErrors: ValidationIssue[];
};

const taxModeOptions: Array<{
  description: string;
  label: string;
  value: FeeItemTaxMode;
}> = [
  {
    description: 'Use the default GST/PST values from app settings.',
    label: 'Inherit app default',
    value: 'inherit_default',
  },
  {
    description: 'Override GST/PST only for this cost item.',
    label: 'Custom tax',
    value: 'custom',
  },
];

const activeStatusOptions = [
  {
    description: 'Include this line in current calculations.',
    label: 'Active',
    value: true,
  },
  {
    description: 'Keep the row but exclude it from current calculations.',
    label: 'Inactive',
    value: false,
  },
] as const;

function getFieldError(
  errors: ValidationIssue[],
  field: keyof FeeItemFormValues,
) {
  return errors.find(issue => issue.field === field)?.message;
}

type ChoiceOption<Value extends string | boolean> = {
  description: string;
  label: string;
  value: Value;
};

function ChoicePillGroup<Value extends string | boolean>({
  label,
  onChange,
  options,
  selectedValue,
}: {
  label: string;
  onChange: (value: Value) => void;
  options: ChoiceOption<Value>[];
  selectedValue: Value;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
        {label}
      </Text>
      <View style={styles.choices}>
        {options.map(option => {
          const isSelected = option.value === selectedValue;

          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="button"
              onPress={() => {
                onChange(option.value);
              }}
              style={({ pressed }) => [
                styles.choice,
                {
                  backgroundColor: isSelected
                    ? theme.colors.surfaceMuted
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.accent
                    : theme.colors.border,
                  borderRadius: theme.radius.sm,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.choiceLabel,
                  {
                    color: isSelected
                      ? theme.colors.accent
                      : theme.colors.textPrimary,
                  },
                ]}>
                {option.label}
              </Text>
              <Text style={[styles.choiceDescription, { color: theme.colors.textMuted }]}>
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CostItemEditorCard({
  editorMode,
  formValues,
  hasPrimaryGym,
  onClose,
  onSave,
  onSetFieldValue,
  primaryGymName,
  saveFeedback,
  saveState,
  validationErrors,
}: CostItemEditorCardProps) {
  const theme = useAppTheme();

  const categoryOptions: ChoiceOption<FeeItemCategory>[] = feeItemCategories.map(
    category => ({
      description:
        category === 'other'
          ? 'Use any custom label for add-ons like parking or towel rental.'
          : 'Pick the closest default category for this line item.',
      label: formatCostItemCategory(category),
      value: category,
    }),
  );

  const cadenceOptions: ChoiceOption<FeeItemCadenceForV01>[] =
    feeItemCadencesForV01.map(cadence => ({
      description:
        cadence === 'one_time'
          ? 'Charge this line once inside its date range.'
          : cadence === 'monthly'
            ? 'Apply this line once per active month.'
            : 'Apply this line once per active annual cycle.',
      label: formatCostItemCadence(cadence),
      value: cadence,
    }));

  return (
    <Card
      subtitle={
        editorMode === 'edit'
          ? 'Update the selected fee item. Category, cadence, tax mode, and active state all save back to SQLite.'
          : 'Create a new fee item under the current primary gym. The same surface will support deactivate/delete actions in the next task.'
      }
      title={editorMode === 'edit' ? 'Edit cost item' : 'Add cost item'}>
      <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
        {hasPrimaryGym
          ? `Saving to primary gym: ${primaryGymName ?? 'Unnamed gym'}.`
          : 'A primary gym is required before costs can be saved.'}
      </Text>

      {saveFeedback ? (
        <Text
          style={[
            styles.feedback,
            {
              color:
                saveState === 'error'
                  ? theme.colors.danger
                  : saveState === 'success'
                    ? theme.colors.accent
                    : theme.colors.textSecondary,
            },
          ]}>
          {saveFeedback}
        </Text>
      ) : null}

      <View style={[styles.form, { marginTop: theme.spacing.lg }]}>
        <TextField
          errorMessage={getFieldError(validationErrors, 'label')}
          helperText="Use a clear label such as Main membership, Locker rental, or Parking."
          label="Label"
          onChangeText={value => {
            onSetFieldValue('label', value);
          }}
          placeholder="Monthly membership"
          value={formValues.label}
        />

        <ChoicePillGroup
          label="Category"
          onChange={value => {
            onSetFieldValue('category', value);
          }}
          options={categoryOptions}
          selectedValue={formValues.category || 'monthly_membership'}
        />

        <ChoicePillGroup
          label="Cadence"
          onChange={value => {
            onSetFieldValue('cadence', value);
          }}
          options={cadenceOptions}
          selectedValue={formValues.cadence || 'monthly'}
        />

        <TextField
          errorMessage={getFieldError(validationErrors, 'amountPreTax')}
          helperText="Enter the pre-tax amount in CAD. Example: 59.99"
          keyboardType="decimal-pad"
          label="Amount (pre-tax)"
          onChangeText={value => {
            onSetFieldValue('amountPreTax', value);
          }}
          placeholder="59.99"
          value={formValues.amountPreTax}
        />

        <View style={styles.inlineFields}>
          <View style={styles.inlineField}>
            <TextField
              errorMessage={getFieldError(validationErrors, 'startDate')}
              helperText="YYYY-MM-DD"
              label="Start date"
              onChangeText={value => {
                onSetFieldValue('startDate', value);
              }}
              placeholder="2026-04-02"
              value={formValues.startDate}
            />
          </View>
          <View style={styles.inlineField}>
            <TextField
              errorMessage={getFieldError(validationErrors, 'endDate')}
              helperText="Optional. Leave blank for an open-ended line."
              label="End date"
              onChangeText={value => {
                onSetFieldValue('endDate', value);
              }}
              placeholder="2026-12-31"
              value={formValues.endDate}
            />
          </View>
        </View>

        <ChoicePillGroup
          label="Tax mode"
          onChange={value => {
            onSetFieldValue('taxMode', value);
          }}
          options={taxModeOptions}
          selectedValue={formValues.taxMode}
        />

        {formValues.taxMode === 'custom' ? (
          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <TextField
                helperText="Decimal rate, for example 0.05"
                label="GST rate"
                onChangeText={value => {
                  onSetFieldValue('gstRate', value);
                }}
                placeholder="0.05"
                value={formValues.gstRate}
              />
            </View>
            <View style={styles.inlineField}>
              <TextField
                helperText="Decimal rate, for example 0.07"
                label="PST rate"
                onChangeText={value => {
                  onSetFieldValue('pstRate', value);
                }}
                placeholder="0.07"
                value={formValues.pstRate}
              />
            </View>
          </View>
        ) : null}

        <ChoicePillGroup
          label="Status"
          onChange={value => {
            onSetFieldValue('isActive', value);
          }}
          options={activeStatusOptions}
          selectedValue={formValues.isActive}
        />
      </View>

      <View style={[styles.actions, { marginTop: theme.spacing.xl }]}>
        <PrimaryButton
          disabled={saveState === 'saving'}
          label={
            saveState === 'saving'
              ? 'Saving Cost...'
              : editorMode === 'edit'
                ? 'Save Cost Changes'
                : 'Create Cost Item'
          }
          onPress={() => {
            onSave();
          }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.secondaryAction, { opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[styles.secondaryActionLabel, { color: theme.colors.textMuted }]}>
            Close Editor
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  choice: {
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  choiceDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  choiceLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  choices: {
    gap: 10,
  },
  feedback: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 12,
  },
  field: {
    gap: 8,
  },
  form: {
    gap: 18,
  },
  inlineField: {
    flex: 1,
    minWidth: 0,
  },
  inlineFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  meta: {
    fontSize: 15,
    lineHeight: 22,
  },
  secondaryAction: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  secondaryActionLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
