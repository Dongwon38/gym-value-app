import React from 'react';
import { Pressable, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';

import type { FeeItemFormValues } from '../../../domain/forms';
import type { AppSettings, FeeItemCadence } from '../../../domain/models';
import type { ValidationIssue } from '../../../utils/validation';
import {
  BottomSheetFormShell,
  Button,
  Input,
  Row,
  Text,
} from '../../../ui';
import { appTheme } from '../../../ui/theme';
import {
  getStarterCostPreset,
  shouldShowBillingAnchorDate,
  type CostSetupLineDraft,
  type StarterCostPresetKey,
} from '../useCases/costSetup';

type CostKind = StarterCostPresetKey | 'custom';

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
  onSelectKind: (kind: CostKind) => void;
  saveFeedback: string | null;
  saveState: 'idle' | 'saving' | 'success' | 'error';
  showKindSelector?: boolean;
  validationErrors: ValidationIssue[] | undefined;
  visible: boolean;
};

type Option<Value extends string> = {
  label: string;
  value: Value;
};

type DropdownFieldProps<Value extends string> = {
  label: string;
  onChange: (value: Value) => void;
  options: Array<Option<Value>>;
  value: Value;
};

const costKindOptions: Array<Option<CostKind>> = [
  { label: 'Membership', value: 'membership' },
  { label: 'Signup Fee', value: 'signup' },
  { label: 'Annual Fee', value: 'annual' },
  { label: 'Locker Fee', value: 'locker' },
  { label: 'Custom', value: 'custom' },
];

const cadenceOptions: Option<Exclude<FeeItemCadence, 'custom'>>[] = [
  { label: 'Once', value: 'one_time' },
  { label: 'Bi-weekly', value: 'bi_weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annual', value: 'annual' },
];

const taxOptions: Option<FeeItemFormValues['amountInputMode']>[] = [
  { label: 'Pre-tax', value: 'pre_tax' },
  { label: 'Post-tax', value: 'post_tax' },
  { label: 'No tax', value: 'tax_exempt' },
  { label: 'Custom', value: 'custom' },
];

function getFieldError(
  errors: ValidationIssue[] | undefined,
  field: keyof FeeItemFormValues,
) {
  return errors?.find(issue => issue.field === field)?.message;
}

function getSelectedCostKind(line: CostSetupLineDraft): CostKind {
  if (line.kind === 'custom') {
    return 'custom';
  }

  return line.presetKey ?? 'custom';
}

function DropdownField<Value extends string>({
  label,
  onChange,
  options,
  value,
}: DropdownFieldProps<Value>) {
  const [open, setOpen] = React.useState(false);
  const selectedOption =
    options.find(option => option.value === value) ?? options[0] ?? null;

  return (
    <View className="gap-2">
      <Text tone="secondary" variant="inputLabel">
        {label}
      </Text>
      <View className="gap-2">
        <Pressable
          className="min-h-[52px] flex-row items-center justify-between rounded-lg border border-border/70 bg-input px-4 active:opacity-90"
          onPress={() => {
            setOpen(currentValue => !currentValue);
          }}>
          <Text variant="body">{selectedOption?.label ?? ''}</Text>
          <ChevronDown
            color={appTheme.colors.iconMuted}
            size={18}
            strokeWidth={2.2}
          />
        </Pressable>

        {open ? (
          <View className="overflow-hidden rounded-xl border border-border/70 bg-card">
            {options.map(option => {
              const isSelected = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  className="flex-row items-center justify-between border-b border-border/60 px-4 py-3 last:border-b-0 active:bg-muted-card"
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}>
                  <Text className={isSelected ? 'text-foreground' : ''} variant="body">
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Check
                      color={appTheme.colors.success}
                      size={16}
                      strokeWidth={2.4}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
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
  onSelectKind,
  saveFeedback,
  saveState,
  showKindSelector = false,
  validationErrors,
  visible,
}: CostEditorSheetProps) {
  if (!line) {
    return null;
  }

  const selectedCostKind = getSelectedCostKind(line);
  const presetTitle = line.presetKey ? getStarterCostPreset(line.presetKey).title : null;
  const title = line.existingFeeItemId ? `Edit ${presetTitle ?? 'Cost'}` : 'Add Cost';

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
      subtitle={appSettings?.currency ? `Currency ${appSettings.currency}` : undefined}
      title={title}
      visible={visible}>
      {saveFeedback ? (
        <Text tone={saveState === 'error' ? 'destructive' : 'success'} variant="bodyMuted">
          {saveFeedback}
        </Text>
      ) : null}

      {showKindSelector ? (
        <View className="gap-2">
          <Text tone="secondary" variant="inputLabel">
            Cost type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {costKindOptions.map(option => {
              const isSelected = option.value === selectedCostKind;

              return (
                <Pressable
                  key={option.value}
                  className={`rounded-full border px-3 py-2 active:opacity-85 ${
                    isSelected
                      ? 'border-success/40 bg-success-soft'
                      : 'border-border/70 bg-card'
                  }`}
                  onPress={() => {
                    onSelectKind(option.value);
                  }}>
                  <Text tone={isSelected ? 'success' : 'secondary'} variant="listMeta">
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {line.kind === 'custom' ? (
        <Input
          errorText={getFieldError(validationErrors, 'label')}
          label="Name"
          onChangeText={value => {
            onChangeField('label', value);
          }}
          placeholder="Custom cost"
          value={line.formValues.label}
        />
      ) : (
        <View className="gap-1">
          <Text tone="secondary" variant="inputLabel">
            Name
          </Text>
          <Text variant="body">{presetTitle ?? line.formValues.label}</Text>
        </View>
      )}

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
        <View className="flex-1">
          <DropdownField
            label="Cadence"
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

      <DropdownField
        label="Tax"
        onChange={value => {
          onChangeField('amountInputMode', value);
        }}
        options={taxOptions}
        value={line.formValues.amountInputMode}
      />

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
