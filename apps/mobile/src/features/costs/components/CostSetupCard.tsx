import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  FeeItemAmountInputMode,
  FeeItemFormValues,
} from '../../../domain/forms';
import type { AppSettings, FeeItemCategory } from '../../../domain/models';
import { feeItemCadences, feeItemCategories } from '../../../domain/models';
import type { ValidationIssue } from '../../../utils/validation';
import { Card, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { formatCostItemCategory } from '../useCases/costItems';
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

type CompactOption<Value extends string> = {
  label: string;
  value: Value;
};

const cadenceOptions: CompactOption<
  Exclude<(typeof feeItemCadences)[number], 'custom'>
>[] = [
  { label: 'Once', value: 'one_time' },
  { label: '2wk', value: 'bi_weekly' },
  { label: 'Month', value: 'monthly' },
  { label: 'Year', value: 'annual' },
];

const amountModeOptions: CompactOption<FeeItemAmountInputMode>[] = [
  { label: 'Pre-tax', value: 'pre_tax' },
  { label: 'Post-tax', value: 'post_tax' },
  { label: 'No tax', value: 'tax_exempt' },
  { label: 'Custom', value: 'custom' },
];

const customCategoryOptions: CompactOption<FeeItemCategory>[] = feeItemCategories.map(
  category => ({
    label: formatCostItemCategory(category),
    value: category,
  }),
);

function getFieldError(
  errors: ValidationIssue[] | undefined,
  field: keyof FeeItemFormValues,
) {
  return errors?.find(issue => issue.field === field)?.message;
}

function CompactSegmentedControl<Value extends string>({
  onChange,
  options,
  selectedValue,
}: {
  onChange: (value: Value) => void;
  options: CompactOption<Value>[];
  selectedValue: Value;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.segmentedControl}>
      {options.map(option => {
        const isSelected = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => {
              onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: isSelected
                  ? theme.colors.accent
                  : theme.colors.surface,
                borderColor: isSelected
                  ? theme.colors.accent
                  : theme.colors.border,
                borderRadius: theme.radius.sm,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: isSelected
                    ? theme.colors.accentContrast
                    : theme.colors.textSecondary,
                },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const CostSetupLineRow = memo(function CostSetupLineRow({
  appSettings,
  line,
  onRemoveCustomLine,
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
  const amountFieldLabel =
    line.formValues.amountInputMode === 'post_tax' ? 'Amount (after tax)' : 'Amount';
  const amountPreviewLabel =
    line.formValues.amountInputMode === 'post_tax'
      ? preview
        ? `Pre ${formatCostSetupMoney(preview.preTaxAmount, appSettings)}`
        : 'Pre -'
      : preview
        ? `Post ${formatCostSetupMoney(preview.totalAmount, appSettings)}`
        : 'Post -';
  const title =
    line.kind === 'starter'
      ? preset?.title ?? 'Cost line'
      : line.formValues.label.trim() || 'Custom line';
  const amountIsBlank = line.formValues.amountPreTax.trim().length === 0;

  return (
    <View
      style={[
        styles.rowCard,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
        },
      ]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowHeaderMain}>
          <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
          {line.existingFeeItemId ? (
            <Text style={[styles.rowMeta, { color: theme.colors.accent }]}>
              Saved
            </Text>
          ) : null}
        </View>
        <View style={styles.rowHeaderActions}>
          <Text style={[styles.amountPreview, { color: theme.colors.textSecondary }]}>
            {amountPreviewLabel}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onToggleLineAdvanced(line.draftId);
            }}
            style={({ pressed }) => [
              styles.smallAction,
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <Text style={[styles.smallActionLabel, { color: theme.colors.accent }]}>
              {line.showAdvanced ? 'Less' : 'More'}
            </Text>
          </Pressable>
        </View>
      </View>

      {line.kind === 'custom' ? (
        <TextField
          dense
          errorMessage={getFieldError(validationErrors, 'label')}
          label="Label"
          onChangeText={value => {
            onSetLineFieldValue(line.draftId, 'label', value);
          }}
          placeholder="Parking"
          value={line.formValues.label}
        />
      ) : null}

      <View style={styles.compactGrid}>
        <View style={styles.compactPrimaryField}>
          <TextField
            dense
            errorMessage={getFieldError(validationErrors, 'amountPreTax')}
            keyboardType="decimal-pad"
            label={amountFieldLabel}
            onChangeText={value => {
              onSetLineFieldValue(line.draftId, 'amountPreTax', value);
            }}
            placeholder="59.99"
            value={line.formValues.amountPreTax}
          />
        </View>
        <View
          style={[
            styles.summaryBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.sm,
            },
          ]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
            {line.formValues.amountInputMode === 'post_tax' ? 'Stored pre-tax' : 'After tax'}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {preview
              ? formatCostSetupMoney(
                  line.formValues.amountInputMode === 'post_tax'
                    ? preview.preTaxAmount
                    : preview.totalAmount,
                  appSettings,
                )
              : '-'}
          </Text>
        </View>
      </View>

      <View style={styles.compactField}>
        <Text style={[styles.compactLabel, { color: theme.colors.textMuted }]}>
          Every
        </Text>
        <CompactSegmentedControl
          onChange={value => {
            onSetLineFieldValue(line.draftId, 'cadence', value);
          }}
          options={cadenceOptions}
          selectedValue={(line.formValues.cadence || preset?.defaultCadence || 'monthly') as Exclude<
            (typeof feeItemCadences)[number],
            'custom'
          >}
        />
      </View>

      <View style={styles.compactField}>
        <Text style={[styles.compactLabel, { color: theme.colors.textMuted }]}>
          Tax
        </Text>
        <CompactSegmentedControl
          onChange={value => {
            onSetLineFieldValue(line.draftId, 'amountInputMode', value);
          }}
          options={amountModeOptions}
          selectedValue={line.formValues.amountInputMode}
        />
      </View>

      {line.showAdvanced ? (
        <View style={styles.advancedStack}>
          {line.kind === 'starter' ? (
            <TextField
              dense
              label="Label"
              onChangeText={value => {
                onSetLineFieldValue(line.draftId, 'label', value);
              }}
              placeholder={preset?.defaultLabel ?? 'Cost label'}
              value={line.formValues.label}
            />
          ) : (
            <View style={styles.compactField}>
              <Text style={[styles.compactLabel, { color: theme.colors.textMuted }]}>
                Category
              </Text>
              <CompactSegmentedControl
                onChange={value => {
                  onSetLineFieldValue(line.draftId, 'category', value);
                }}
                options={customCategoryOptions}
                selectedValue={line.formValues.category || 'other'}
              />
            </View>
          )}

          <View style={styles.dateGrid}>
            <View style={styles.dateField}>
              <TextField
                dense
                errorMessage={getFieldError(validationErrors, 'startDate')}
                label="Start"
                onChangeText={value => {
                  onSetLineFieldValue(line.draftId, 'startDate', value);
                }}
                placeholder="2026-04-03"
                value={line.formValues.startDate}
              />
            </View>
            <View style={styles.dateField}>
              <TextField
                dense
                errorMessage={getFieldError(validationErrors, 'endDate')}
                label="End"
                onChangeText={value => {
                  onSetLineFieldValue(line.draftId, 'endDate', value);
                }}
                placeholder="Optional"
                value={line.formValues.endDate}
              />
            </View>
          </View>

          {shouldShowBillingAnchorDate(line.formValues.cadence) ? (
            <TextField
              dense
              errorMessage={getFieldError(validationErrors, 'billingAnchorDate')}
              label="Billing anchor"
              onChangeText={value => {
                onSetLineFieldValue(line.draftId, 'billingAnchorDate', value);
              }}
              placeholder="2026-01-15"
              value={line.formValues.billingAnchorDate}
            />
          ) : null}

          {line.formValues.amountInputMode === 'custom' ? (
            <View style={styles.dateGrid}>
              <View style={styles.dateField}>
                <TextField
                  dense
                  errorMessage={getFieldError(validationErrors, 'taxMode')}
                  keyboardType="decimal-pad"
                  label="GST"
                  onChangeText={value => {
                    onSetLineFieldValue(line.draftId, 'gstRate', value);
                  }}
                  placeholder="0.05"
                  value={line.formValues.gstRate}
                />
              </View>
              <View style={styles.dateField}>
                <TextField
                  dense
                  errorMessage={getFieldError(validationErrors, 'taxMode')}
                  keyboardType="decimal-pad"
                  label="PST"
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

      {line.existingFeeItemId && amountIsBlank ? (
        <Text style={[styles.inlineHint, { color: theme.colors.warning }]}>
          Blank amount will deactivate this saved row on save.
        </Text>
      ) : null}

      {line.kind === 'custom' && !line.existingFeeItemId ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onRemoveCustomLine(line.draftId);
          }}
          style={({ pressed }) => [
            styles.smallAction,
            { opacity: pressed ? 0.7 : 1 },
          ]}>
          <Text style={[styles.smallActionLabel, { color: theme.colors.danger }]}>
            Remove
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

export function CostSetupCard({
  appSettings,
  customLines,
  hasPrimaryGym,
  onAddCustomLine,
  onRemoveCustomLine,
  onSave,
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
    <Card title="Costs">
      <View style={styles.toolbar}>
        <Text style={[styles.toolbarText, { color: theme.colors.textSecondary }]}>
          {hasPrimaryGym
            ? primaryGymName ?? 'Primary gym'
            : 'Set a primary gym first'}
        </Text>
        <PrimaryButton
          disabled={supportState !== 'ready' || !hasPrimaryGym || saveState === 'saving'}
          label={saveState === 'saving' ? 'Saving...' : 'Save'}
          onPress={onSave}
        />
      </View>

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

      <View style={styles.rowStack}>
        {starterLines.map(line => (
          <CostSetupLineRow
            key={line.draftId}
            appSettings={appSettings}
            line={line}
            onRemoveCustomLine={onRemoveCustomLine}
            onSetLineFieldValue={onSetLineFieldValue}
            onToggleLineAdvanced={onToggleLineAdvanced}
            validationErrors={validationErrorsByLine[line.draftId]}
          />
        ))}

        {customLines.map(line => (
          <CostSetupLineRow
            key={line.draftId}
            appSettings={appSettings}
            line={line}
            onRemoveCustomLine={onRemoveCustomLine}
            onSetLineFieldValue={onSetLineFieldValue}
            onToggleLineAdvanced={onToggleLineAdvanced}
            validationErrors={validationErrorsByLine[line.draftId]}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onAddCustomLine}
        style={({ pressed }) => [
          styles.addLineAction,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.sm,
            marginTop: theme.spacing.lg,
            opacity: pressed ? 0.75 : 1,
          },
        ]}>
        <Text style={[styles.addLineLabel, { color: theme.colors.textPrimary }]}>
          Add custom line
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  addLineAction: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  addLineLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  advancedStack: {
    gap: 12,
    marginTop: 12,
  },
  amountPreview: {
    fontSize: 12,
    lineHeight: 16,
  },
  compactField: {
    gap: 6,
  },
  compactGrid: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 12,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  compactPrimaryField: {
    flex: 1,
  },
  dateField: {
    flex: 1,
  },
  dateGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  rowCard: {
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  rowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rowHeaderActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowHeaderMain: {
    flex: 1,
    gap: 2,
  },
  rowMeta: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  rowStack: {
    gap: 12,
    marginTop: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    borderWidth: 1,
    minHeight: 34,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  smallAction: {
    alignSelf: 'flex-start',
  },
  smallActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  summaryBox: {
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 108,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  toolbarText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
