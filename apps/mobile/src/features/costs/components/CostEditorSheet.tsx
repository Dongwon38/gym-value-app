import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeeItemFormValues } from '../../../domain/forms';
import type { AppSettings, FeeItemCategory, FeeItemCadence } from '../../../domain/models';
import type { ValidationIssue } from '../../../utils/validation';
import { BottomSheet, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { formatCostItemCategory } from '../useCases/costItems';
import {
  getStarterCostPreset,
  shouldShowBillingAnchorDate,
  type CostSetupLineDraft,
} from '../useCases/costSetup';

type CostEditorSheetProps = {
  appSettings: Pick<
    AppSettings,
    'currency' | 'defaultGstRate' | 'defaultPstRate' | 'locale'
  > | null;
  line: CostSetupLineDraft | null;
  onChangeField: <Field extends keyof FeeItemFormValues>(
    field: Field,
    value: FeeItemFormValues[Field],
  ) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  saveFeedback: string | null;
  saveState: 'idle' | 'saving' | 'success' | 'error';
  validationErrors: ValidationIssue[] | undefined;
  visible: boolean;
};

type Option<Value extends string> = {
  label: string;
  value: Value;
};

const cadenceOptions: Option<Exclude<FeeItemCadence, 'custom'>>[] = [
  { label: 'One-time', value: 'one_time' },
  { label: 'Bi-weekly', value: 'bi_weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annual', value: 'annual' },
];

const taxOptions: Option<FeeItemFormValues['amountInputMode']>[] = [
  { label: 'Pre-tax', value: 'pre_tax' },
  { label: 'Post-tax', value: 'post_tax' },
  { label: 'No tax', value: 'tax_exempt' },
  { label: 'Custom tax', value: 'custom' },
];

const categoryOptions: Option<FeeItemCategory>[] = [
  { label: 'Membership', value: 'monthly_membership' },
  { label: 'Annual fee', value: 'annual_fee' },
  { label: 'Signup fee', value: 'signup_fee' },
  { label: 'Locker fee', value: 'locker_fee' },
  { label: 'Personal training', value: 'pt' },
  { label: 'Other', value: 'other' },
];

function getFieldError(
  errors: ValidationIssue[] | undefined,
  field: keyof FeeItemFormValues,
) {
  return errors?.find(issue => issue.field === field)?.message;
}

function SheetDropdownField<Value extends string>({
  label,
  onChange,
  options,
  selectedValue,
}: {
  label: string;
  onChange: (value: Value) => void;
  options: Option<Value>[];
  selectedValue: Value;
}) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <View style={styles.dropdownField}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setOpen(currentValue => !currentValue);
        }}
        style={({ pressed }) => [
          styles.dropdownTrigger,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.sm,
            opacity: pressed ? 0.78 : 1,
          },
        ]}>
        <Text style={[styles.dropdownLabel, { color: theme.colors.textMuted }]}>
          {label}
        </Text>
        <View style={styles.dropdownValueRow}>
          <Text style={[styles.dropdownValue, { color: theme.colors.textPrimary }]}>
            {selectedOption?.label ?? '-'}
          </Text>
          <Text style={[styles.dropdownLabel, { color: theme.colors.textMuted }]}>
            {open ? '▲' : '▼'}
          </Text>
        </View>
      </Pressable>

      {open ? (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.sm,
            },
          ]}>
          {options.map(option => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={({ pressed }) => [
                styles.dropdownOption,
                {
                  backgroundColor:
                    option.value === selectedValue
                      ? theme.colors.surfaceMuted
                      : theme.colors.surface,
                  opacity: pressed ? 0.76 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.dropdownOptionLabel,
                  {
                    color:
                      option.value === selectedValue
                        ? theme.colors.accent
                        : theme.colors.textPrimary,
                  },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function CostEditorSheet({
  appSettings,
  line,
  onChangeField,
  onClose,
  onDelete,
  onSave,
  saveFeedback,
  saveState,
  validationErrors,
  visible,
}: CostEditorSheetProps) {
  const theme = useAppTheme();

  if (!line) {
    return null;
  }

  const presetTitle = line.presetKey ? getStarterCostPreset(line.presetKey).title : null;
  const baseTitle = (presetTitle ?? line.formValues.label) || 'Cost';
  const title = line.existingFeeItemId
    ? `Edit ${baseTitle}`
    : `Add ${presetTitle ?? 'Cost'}`;

  const footer = (
    <View style={styles.footerRow}>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.pill,
            opacity: pressed ? 0.76 : 1,
          },
        ]}>
        <Text style={[styles.secondaryButtonLabel, { color: theme.colors.textSecondary }]}>
          Cancel
        </Text>
      </Pressable>
      <PrimaryButton
        label={saveState === 'saving' ? 'Saving...' : line.existingFeeItemId ? 'Save' : 'Add'}
        onPress={onSave}
        style={styles.primaryFooterButton}
      />
    </View>
  );

  return (
    <BottomSheet
      footer={footer}
      onClose={onClose}
      subtitle={
        appSettings?.currency
          ? `Default currency ${appSettings.currency}`
          : 'Edit cost details'
      }
      title={title}
      visible={visible}>
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

      <TextField
        errorMessage={getFieldError(validationErrors, 'label')}
        label="Name"
        onChangeText={value => {
          onChangeField('label', value);
        }}
        placeholder={presetTitle ?? 'Monthly Membership'}
        value={line.formValues.label}
      />

      <View style={styles.twoColumnRow}>
        <View style={styles.flexField}>
          <TextField
            errorMessage={getFieldError(validationErrors, 'amountPreTax')}
            keyboardType="decimal-pad"
            label={`Amount (${appSettings?.currency ?? 'CAD'})`}
            onChangeText={value => {
              onChangeField('amountPreTax', value);
            }}
            placeholder="0.00"
            value={line.formValues.amountPreTax}
          />
        </View>
        <View style={styles.flexField}>
          <SheetDropdownField
            label="Cadence"
            onChange={value => {
              onChangeField('cadence', value);
            }}
            options={cadenceOptions}
            selectedValue={(line.formValues.cadence || 'monthly') as Exclude<
              FeeItemCadence,
              'custom'
            >}
          />
        </View>
      </View>

      <SheetDropdownField
        label="Tax"
        onChange={value => {
          onChangeField('amountInputMode', value);
        }}
        options={taxOptions}
        selectedValue={line.formValues.amountInputMode}
      />

      {line.kind === 'custom' ? (
        <SheetDropdownField
          label="Category"
          onChange={value => {
            onChangeField('category', value);
          }}
          options={categoryOptions}
          selectedValue={(line.formValues.category || 'other') as FeeItemCategory}
        />
      ) : (
        <View
          style={[
            styles.infoRow,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.sm,
            },
          ]}>
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
            Category
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            {formatCostItemCategory(
              (line.formValues.category || 'other') as FeeItemCategory,
            )}
          </Text>
        </View>
      )}

      <View style={styles.twoColumnRow}>
        <View style={styles.flexField}>
          <TextField
            errorMessage={getFieldError(validationErrors, 'startDate')}
            label="Start"
            onChangeText={value => {
              onChangeField('startDate', value);
            }}
            placeholder="2026-04-04"
            value={line.formValues.startDate}
          />
        </View>
        <View style={styles.flexField}>
          <TextField
            errorMessage={getFieldError(validationErrors, 'endDate')}
            label="End"
            onChangeText={value => {
              onChangeField('endDate', value);
            }}
            placeholder="Optional"
            value={line.formValues.endDate}
          />
        </View>
      </View>

      {shouldShowBillingAnchorDate(line.formValues.cadence) ? (
        <TextField
          errorMessage={getFieldError(validationErrors, 'billingAnchorDate')}
          label="Billing anchor"
          onChangeText={value => {
            onChangeField('billingAnchorDate', value);
          }}
          placeholder="2026-01-15"
          value={line.formValues.billingAnchorDate}
        />
      ) : null}

      {line.formValues.amountInputMode === 'custom' ? (
        <View style={styles.twoColumnRow}>
          <View style={styles.flexField}>
            <TextField
              errorMessage={getFieldError(validationErrors, 'taxMode')}
              keyboardType="decimal-pad"
              label="GST"
              onChangeText={value => {
                onChangeField('gstRate', value);
              }}
              placeholder="0.05"
              value={line.formValues.gstRate}
            />
          </View>
          <View style={styles.flexField}>
            <TextField
              errorMessage={getFieldError(validationErrors, 'taxMode')}
              keyboardType="decimal-pad"
              label="PST"
              onChangeText={value => {
                onChangeField('pstRate', value);
              }}
              placeholder="0.07"
              value={line.formValues.pstRate}
            />
          </View>
        </View>
      ) : null}

      {line.existingFeeItemId || line.kind === 'custom' ? (
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            { opacity: pressed ? 0.76 : 1 },
          ]}>
          <Text style={[styles.deleteButtonLabel, { color: theme.colors.danger }]}>
            {line.existingFeeItemId ? 'Move to inactive' : 'Remove draft'}
          </Text>
        </Pressable>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  deleteButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  dropdownField: {
    gap: 6,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  dropdownMenu: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  dropdownTrigger: {
    borderWidth: 1,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  dropdownValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  feedback: {
    fontSize: 13,
    lineHeight: 18,
  },
  flexField: {
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  infoRow: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 6,
  },
  primaryFooterButton: {
    alignSelf: 'stretch',
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
