import React from 'react';
import { Pressable, View } from 'react-native';

import type { FeeItemFormValues } from '../../../domain/forms';
import type { AppSettings, FeeItemCategory, FeeItemCadence } from '../../../domain/models';
import type { ValidationIssue } from '../../../utils/validation';
import {
  BottomSheetFormShell,
  Button,
  Card,
  Input,
  Row,
  SegmentedControl,
  Text,
} from '../../../ui';
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
  { label: 'Once', value: 'one_time' },
  { label: '2wk', value: 'bi_weekly' },
  { label: 'Month', value: 'monthly' },
  { label: 'Year', value: 'annual' },
];

const taxOptions: Option<FeeItemFormValues['amountInputMode']>[] = [
  { label: 'Pre-tax', value: 'pre_tax' },
  { label: 'Post-tax', value: 'post_tax' },
  { label: 'No tax', value: 'tax_exempt' },
  { label: 'Custom', value: 'custom' },
];

const categoryOptions: Option<FeeItemCategory>[] = [
  { label: 'Membership', value: 'monthly_membership' },
  { label: 'Annual', value: 'annual_fee' },
  { label: 'Signup', value: 'signup_fee' },
  { label: 'Locker', value: 'locker_fee' },
  { label: 'PT', value: 'pt' },
  { label: 'Other', value: 'other' },
];

function getFieldError(
  errors: ValidationIssue[] | undefined,
  field: keyof FeeItemFormValues,
) {
  return errors?.find(issue => issue.field === field)?.message;
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
  if (!line) {
    return null;
  }

  const presetTitle = line.presetKey ? getStarterCostPreset(line.presetKey).title : null;
  const baseTitle = (presetTitle ?? line.formValues.label) || 'Cost';
  const title = line.existingFeeItemId
    ? `Edit ${baseTitle}`
    : `Add ${presetTitle ?? 'Cost'}`;

  return (
    <BottomSheetFormShell
      footer={
        <Row className="gap-3">
          <Button className="flex-1" label="Cancel" onPress={onClose} variant="secondary" />
          <Button
            className="flex-1"
            disabled={saveState === 'saving'}
            label={saveState === 'saving' ? 'Saving...' : line.existingFeeItemId ? 'Save' : 'Add'}
            onPress={onSave}
          />
        </Row>
      }
      onClose={onClose}
      subtitle={
        appSettings?.currency
          ? `Default currency ${appSettings.currency}`
          : 'Edit cost details'
      }
      title={title}
      visible={visible}>
      {saveFeedback ? (
        <Text tone={saveState === 'error' ? 'destructive' : 'success'} variant="bodyMuted">
          {saveFeedback}
        </Text>
      ) : null}

      <Input
        errorText={getFieldError(validationErrors, 'label')}
        label="Name"
        onChangeText={value => {
          onChangeField('label', value);
        }}
        placeholder={presetTitle ?? 'Monthly Membership'}
        value={line.formValues.label}
      />

      <Row align="start" className="gap-3">
        <View className="flex-1">
          <Input
            errorText={getFieldError(validationErrors, 'amountPreTax')}
            keyboardType="decimal-pad"
            label={`Amount (${appSettings?.currency ?? 'CAD'})`}
            onChangeText={value => {
              onChangeField('amountPreTax', value);
            }}
            placeholder="0.00"
            value={line.formValues.amountPreTax}
          />
        </View>
        <View className="flex-1 gap-2">
          <Text tone="secondary" variant="inputLabel">
            Cadence
          </Text>
          <SegmentedControl
            onChange={value => {
              onChangeField('cadence', value);
            }}
            options={cadenceOptions}
            value={(line.formValues.cadence || 'monthly') as Exclude<
              FeeItemCadence,
              'custom'
            >}
          />
        </View>
      </Row>

      <View className="gap-2">
        <Text tone="secondary" variant="inputLabel">
          Tax
        </Text>
        <SegmentedControl
          onChange={value => {
            onChangeField('amountInputMode', value);
          }}
          options={taxOptions}
          value={line.formValues.amountInputMode}
        />
      </View>

      {line.kind === 'custom' ? (
        <View className="gap-2">
          <Text tone="secondary" variant="inputLabel">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categoryOptions.map(option => {
              const isSelected = option.value === line.formValues.category;

              return (
                <Pressable
                  key={option.value}
                  className={`rounded-full border px-3 py-2 active:opacity-85 ${
                    isSelected
                      ? 'border-success/40 bg-success-soft'
                      : 'border-border/70 bg-card'
                  }`}
                  onPress={() => {
                    onChangeField('category', option.value);
                  }}>
                  <Text tone={isSelected ? 'success' : 'secondary'} variant="listMeta">
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <Card padding="compact" shadow="none" variant="muted">
          <Row justify="between">
            <Text tone="secondary" variant="bodyMuted">
              Category
            </Text>
            <Text variant="body">
              {formatCostItemCategory(
                (line.formValues.category || 'other') as FeeItemCategory,
              )}
            </Text>
          </Row>
        </Card>
      )}

      <Row align="start" className="gap-3">
        <View className="flex-1">
          <Input
            errorText={getFieldError(validationErrors, 'startDate')}
            label="Start"
            onChangeText={value => {
              onChangeField('startDate', value);
            }}
            placeholder="2026-04-04"
            value={line.formValues.startDate}
          />
        </View>
        <View className="flex-1">
          <Input
            errorText={getFieldError(validationErrors, 'endDate')}
            label="End"
            onChangeText={value => {
              onChangeField('endDate', value);
            }}
            placeholder="Optional"
            value={line.formValues.endDate}
          />
        </View>
      </Row>

      {shouldShowBillingAnchorDate(line.formValues.cadence) ? (
        <Input
          errorText={getFieldError(validationErrors, 'billingAnchorDate')}
          label="Billing anchor"
          onChangeText={value => {
            onChangeField('billingAnchorDate', value);
          }}
          placeholder="2026-01-15"
          value={line.formValues.billingAnchorDate}
        />
      ) : null}

      {line.formValues.amountInputMode === 'custom' ? (
        <Row align="start" className="gap-3">
          <View className="flex-1">
            <Input
              errorText={getFieldError(validationErrors, 'taxMode')}
              keyboardType="decimal-pad"
              label="GST"
              onChangeText={value => {
                onChangeField('gstRate', value);
              }}
              placeholder="0.05"
              value={line.formValues.gstRate}
            />
          </View>
          <View className="flex-1">
            <Input
              errorText={getFieldError(validationErrors, 'taxMode')}
              keyboardType="decimal-pad"
              label="PST"
              onChangeText={value => {
                onChangeField('pstRate', value);
              }}
              placeholder="0.07"
              value={line.formValues.pstRate}
            />
          </View>
        </Row>
      ) : null}

      {line.existingFeeItemId || line.kind === 'custom' ? (
        <Button
          label={line.existingFeeItemId ? 'Move to inactive' : 'Remove draft'}
          onPress={onDelete}
          variant="destructive"
        />
      ) : null}
    </BottomSheetFormShell>
  );
}
