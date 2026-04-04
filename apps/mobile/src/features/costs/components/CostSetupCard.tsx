import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeeItemFormValues } from '../../../domain/forms';
import type {
  AppSettings,
  FeeItemCategory,
  FeeItemTaxMode,
} from '../../../domain/models';
import {
  feeItemCategories,
  feeItemCadences,
} from '../../../domain/models';
import type { ValidationIssue } from '../../../utils/validation';
import { Card, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { formatCostItemCadence, formatCostItemCategory } from '../useCases/costItems';
import {
  formatCostSetupMoney,
  getCostSetupLinePreview,
  getStarterCostPreset,
  shouldShowBillingAnchorDate,
  type CostSetupLineDraft,
} from '../useCases/costSetup';

type CostSetupCardProps = {
  appSettings: Pick<
    AppSettings,
    'currency' | 'defaultGstRate' | 'defaultPstRate' | 'locale'
  > | null;
  customLines: CostSetupLineDraft[];
  hasPrimaryGym: boolean;
  onAddCustomLine: () => void;
  onRemoveCustomLine: (lineId: string) => void;
  onSave: () => void;
  onSetLineEnabled: (lineId: string, enabled: boolean) => void;
  onSetLineFieldValue: <Field extends keyof FeeItemFormValues>(
    lineId: string,
    field: Field,
    value: FeeItemFormValues[Field],
  ) => void;
  onToggleLineAdvanced: (lineId: string) => void;
  primaryGymName?: string;
  saveFeedback: string | null;
  saveState: 'idle' | 'saving' | 'success' | 'error';
  starterLines: CostSetupLineDraft[];
  supportError: string | null;
  supportState: 'loading' | 'ready' | 'error';
  validationErrorsByLine: Record<string, ValidationIssue[]>;
};

type ChoiceOption<Value extends string | boolean> = {
  description: string;
  label: string;
  value: Value;
};

const availabilityOptions: ChoiceOption<boolean>[] = [
  {
    description: 'Save this line when an amount is present.',
    label: 'Use',
    value: true,
  },
  {
    description: 'Skip this line or mark an existing row inactive.',
    label: 'Skip',
    value: false,
  },
];

const taxModeOptions: ChoiceOption<FeeItemTaxMode>[] = [
  {
    description: 'Use the default GST/PST values from Settings.',
    label: 'Default tax',
    value: 'inherit_default',
  },
  {
    description: 'Apply no tax to this line.',
    label: 'No tax',
    value: 'none',
  },
  {
    description: 'Override GST/PST only for this line.',
    label: 'Custom tax',
    value: 'custom',
  },
];

const cadenceOptions: ChoiceOption<
  Exclude<(typeof feeItemCadences)[number], 'custom'>
>[] = feeItemCadences
  .filter(cadence => cadence !== 'custom')
  .map(cadence => ({
    description:
      cadence === 'one_time'
        ? 'Save a single charge inside its date range.'
        : cadence === 'bi_weekly'
          ? 'Repeat every 14 days from the billing date anchor.'
          : cadence === 'monthly'
            ? 'Charge once per active month.'
            : 'Charge once per annual cycle.',
    label: formatCostItemCadence(cadence),
    value: cadence,
  }));

const customCategoryOptions: ChoiceOption<FeeItemCategory>[] = feeItemCategories.map(
  category => ({
    description:
      category === 'other'
        ? 'Use a custom label for anything outside the starter presets.'
        : 'Store this custom line under the matching cost category.',
    label: formatCostItemCategory(category),
    value: category,
  }),
);

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
      <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
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
              <Text
                style={[
                  styles.choiceDescription,
                  { color: theme.colors.textMuted },
                ]}>
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getFieldError(
  errors: ValidationIssue[] | undefined,
  field: keyof FeeItemFormValues,
) {
  return errors?.find(issue => issue.field === field)?.message;
}

function CostSetupLineSection({
  appSettings,
  line,
  onRemoveCustomLine,
  onSetLineEnabled,
  onSetLineFieldValue,
  onToggleLineAdvanced,
  validationErrors,
}: {
  appSettings: Pick<
    AppSettings,
    'currency' | 'defaultGstRate' | 'defaultPstRate' | 'locale'
  > | null;
  line: CostSetupLineDraft;
  onRemoveCustomLine: (lineId: string) => void;
  onSetLineEnabled: (lineId: string, enabled: boolean) => void;
  onSetLineFieldValue: <Field extends keyof FeeItemFormValues>(
    lineId: string,
    field: Field,
    value: FeeItemFormValues[Field],
  ) => void;
  onToggleLineAdvanced: (lineId: string) => void;
  validationErrors: ValidationIssue[] | undefined;
}) {
  const theme = useAppTheme();
  const preset = line.presetKey ? getStarterCostPreset(line.presetKey) : null;
  const preview = getCostSetupLinePreview(line, appSettings);
  const title =
    line.kind === 'starter'
      ? preset?.title ?? 'Starter cost line'
      : line.formValues.label.trim() || 'Custom cost line';

  return (
    <View
      style={[
        styles.lineCard,
        !line.enabled ? styles.lineCardMuted : null,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          marginTop: theme.spacing.lg,
          padding: theme.spacing.lg,
        },
      ]}>
      <View style={styles.lineHeader}>
        <View style={styles.lineHeaderContent}>
          <Text style={[styles.lineTitle, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
          <Text
            style={[styles.lineDescription, { color: theme.colors.textSecondary }]}>
            {preset?.description ??
              'Use additional lines for PT, parking, towel service, or any other recurring charge.'}
          </Text>
        </View>
        {line.existingFeeItemId ? (
          <Text style={[styles.persistedBadge, { color: theme.colors.accent }]}>
            Saved row
          </Text>
        ) : null}
      </View>

      <ChoicePillGroup
        label="Availability"
        onChange={value => {
          onSetLineEnabled(line.draftId, value);
        }}
        options={availabilityOptions}
        selectedValue={line.enabled}
      />

      {line.kind === 'custom' ? (
        <TextField
          errorMessage={getFieldError(validationErrors, 'label')}
          helperText="Required when this custom line has an amount."
          label="Custom label"
          onChangeText={value => {
            onSetLineFieldValue(line.draftId, 'label', value);
          }}
          placeholder="Parking, towel service, PT package"
          value={line.formValues.label}
        />
      ) : null}

      <TextField
        errorMessage={getFieldError(validationErrors, 'amountPreTax')}
        helperText="Pre-tax amount only. Leave it blank to skip this line."
        keyboardType="decimal-pad"
        label="Amount (pre-tax)"
        onChangeText={value => {
          onSetLineFieldValue(line.draftId, 'amountPreTax', value);
        }}
        placeholder="59.99"
        value={line.formValues.amountPreTax}
      />

      <ChoicePillGroup
        label="Cadence"
        onChange={value => {
          onSetLineFieldValue(line.draftId, 'cadence', value);
        }}
        options={cadenceOptions}
        selectedValue={(line.formValues.cadence || preset?.defaultCadence || 'monthly') as Exclude<
          (typeof feeItemCadences)[number],
          'custom'
        >}
      />

      <ChoicePillGroup
        label="Tax handling"
        onChange={value => {
          onSetLineFieldValue(line.draftId, 'taxMode', value);
        }}
        options={taxModeOptions}
        selectedValue={line.formValues.taxMode}
      />

      <Text style={[styles.previewText, { color: theme.colors.textSecondary }]}>
        {!line.enabled
          ? 'This line will be skipped when you save.'
          : preview
            ? `${formatCostSetupMoney(
                preview.totalAmount,
                appSettings,
              )} after tax (${formatCostSetupMoney(
                preview.preTaxAmount,
                appSettings,
              )} + ${formatCostSetupMoney(
                preview.totalTaxAmount,
                appSettings,
              )} tax).`
            : 'Enter a pre-tax amount to preview the after-tax total.'}
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          onToggleLineAdvanced(line.draftId);
        }}
        style={({ pressed }) => [
          styles.advancedToggle,
          { opacity: pressed ? 0.7 : 1 },
        ]}>
        <Text style={[styles.advancedToggleLabel, { color: theme.colors.accent }]}>
          {line.showAdvanced ? 'Hide advanced fields' : 'Show advanced fields'}
        </Text>
      </Pressable>

      {line.showAdvanced ? (
        <View style={[styles.advancedFields, { marginTop: theme.spacing.md }]}>
          {line.kind === 'starter' ? (
            <TextField
              helperText="Optional label override for the saved row."
              label="Saved label"
              onChangeText={value => {
                onSetLineFieldValue(line.draftId, 'label', value);
              }}
              placeholder={preset?.defaultLabel ?? 'Cost label'}
              value={line.formValues.label}
            />
          ) : (
            <ChoicePillGroup
              label="Category"
              onChange={value => {
                onSetLineFieldValue(line.draftId, 'category', value);
              }}
              options={customCategoryOptions}
              selectedValue={line.formValues.category || 'other'}
            />
          )}

          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <TextField
                errorMessage={getFieldError(validationErrors, 'startDate')}
                helperText="YYYY-MM-DD"
                label="Start date"
                onChangeText={value => {
                  onSetLineFieldValue(line.draftId, 'startDate', value);
                }}
                placeholder="2026-04-03"
                value={line.formValues.startDate}
              />
            </View>
            <View style={styles.inlineField}>
              <TextField
                errorMessage={getFieldError(validationErrors, 'endDate')}
                helperText="Optional"
                label="End date"
                onChangeText={value => {
                  onSetLineFieldValue(line.draftId, 'endDate', value);
                }}
                placeholder="2026-12-31"
                value={line.formValues.endDate}
              />
            </View>
          </View>

          {shouldShowBillingAnchorDate(line.formValues.cadence) ? (
            <TextField
              errorMessage={getFieldError(validationErrors, 'billingAnchorDate')}
              helperText="Optional billing anchor for annual or bi-weekly charges."
              label="Billing date anchor"
              onChangeText={value => {
                onSetLineFieldValue(line.draftId, 'billingAnchorDate', value);
              }}
              placeholder="2026-01-15"
              value={line.formValues.billingAnchorDate}
            />
          ) : null}

          {line.formValues.taxMode === 'custom' ? (
            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <TextField
                  errorMessage={getFieldError(validationErrors, 'taxMode')}
                  helperText="Decimal rate, for example 0.05"
                  keyboardType="decimal-pad"
                  label="GST rate"
                  onChangeText={value => {
                    onSetLineFieldValue(line.draftId, 'gstRate', value);
                  }}
                  placeholder="0.05"
                  value={line.formValues.gstRate}
                />
              </View>
              <View style={styles.inlineField}>
                <TextField
                  errorMessage={getFieldError(validationErrors, 'taxMode')}
                  helperText="Decimal rate, for example 0.07"
                  keyboardType="decimal-pad"
                  label="PST rate"
                  onChangeText={value => {
                    onSetLineFieldValue(line.draftId, 'pstRate', value);
                  }}
                  placeholder="0.07"
                  value={line.formValues.pstRate}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {line.kind === 'custom' && !line.existingFeeItemId ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onRemoveCustomLine(line.draftId);
          }}
          style={({ pressed }) => [
            styles.removeLineButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}>
          <Text style={[styles.removeLineLabel, { color: theme.colors.danger }]}>
            Remove custom line
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CostSetupCard({
  appSettings,
  customLines,
  hasPrimaryGym,
  onAddCustomLine,
  onRemoveCustomLine,
  onSave,
  onSetLineEnabled,
  onSetLineFieldValue,
  onToggleLineAdvanced,
  primaryGymName,
  saveFeedback,
  saveState,
  starterLines,
  supportError,
  supportState,
  validationErrorsByLine,
}: CostSetupCardProps) {
  const theme = useAppTheme();

  return (
    <Card
      subtitle="The four most common gym charges stay visible by default. Leave any starter line blank or switch it to Skip, then add custom rows only when you need them."
      title="Starter cost setup">
      <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
        {hasPrimaryGym
          ? `Saving active cost rows to primary gym: ${primaryGymName ?? 'Unnamed gym'}.`
          : 'A primary gym is required before costs can be saved.'}
      </Text>

      {supportState === 'loading' ? (
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          Preparing gym and tax defaults for the cost setup screen.
        </Text>
      ) : null}

      {supportState === 'error' ? (
        <Text style={[styles.statusText, { color: theme.colors.danger }]}>
          {supportError ?? 'Cost setup metadata failed to load.'}
        </Text>
      ) : null}

      {saveFeedback ? (
        <Text
          style={[
            styles.statusText,
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

      {starterLines.map(line => (
        <CostSetupLineSection
          key={line.draftId}
          appSettings={appSettings}
          line={line}
          onRemoveCustomLine={onRemoveCustomLine}
          onSetLineEnabled={onSetLineEnabled}
          onSetLineFieldValue={onSetLineFieldValue}
          onToggleLineAdvanced={onToggleLineAdvanced}
          validationErrors={validationErrorsByLine[line.draftId]}
        />
      ))}

      <View style={{ marginTop: theme.spacing.xl }}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Additional cost lines
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Add parking, towel service, PT, family add-ons, or any other cost beyond the starter four.
        </Text>
        {customLines.map(line => (
          <CostSetupLineSection
            key={line.draftId}
            appSettings={appSettings}
            line={line}
            onRemoveCustomLine={onRemoveCustomLine}
            onSetLineEnabled={onSetLineEnabled}
            onSetLineFieldValue={onSetLineFieldValue}
            onToggleLineAdvanced={onToggleLineAdvanced}
            validationErrors={validationErrorsByLine[line.draftId]}
          />
        ))}
        <PrimaryButton
          label="Add Custom Cost Line"
          onPress={onAddCustomLine}
          style={{ marginTop: theme.spacing.lg }}
        />
      </View>

      <PrimaryButton
        disabled={supportState !== 'ready' || !hasPrimaryGym || saveState === 'saving'}
        label={saveState === 'saving' ? 'Saving Cost Setup...' : 'Save Cost Setup'}
        onPress={onSave}
        style={{ marginTop: theme.spacing.xl }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  advancedFields: {
    gap: 16,
  },
  advancedToggle: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  advancedToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  choice: {
    borderWidth: 1,
    gap: 4,
    minWidth: 120,
    padding: 12,
  },
  choiceDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  choiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  inlineField: {
    flex: 1,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 12,
  },
  lineCard: {
    borderWidth: 1,
    gap: 16,
  },
  lineCardMuted: {
    opacity: 0.8,
  },
  lineDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  lineHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  lineHeaderContent: {
    flex: 1,
  },
  lineTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
  persistedBadge: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
  },
  removeLineButton: {
    alignSelf: 'flex-start',
  },
  removeLineLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
});
