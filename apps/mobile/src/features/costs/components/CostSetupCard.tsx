import React, { memo, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type {
  FeeItemAmountInputMode,
  FeeItemFormValues,
} from '../../../domain/forms';
import type { AppSettings, FeeItemCategory } from '../../../domain/models';
import { feeItemCadences, feeItemCategories } from '../../../domain/models';
import type { ValidationIssue } from '../../../utils/validation';
import { Card, PrimaryButton } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { formatCostItemCategory } from '../useCases/costItems';
import {
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
  { label: 'Preset', value: 'pre_tax' },
  { label: 'Final', value: 'post_tax' },
  { label: 'No tax', value: 'tax_exempt' },
  { label: 'Custom', value: 'custom' },
];

const customCategoryOptions: CompactOption<FeeItemCategory>[] = feeItemCategories.map(
  category => ({
    label: formatCompactCategoryLabel(category),
    value: category,
  }),
);

function formatCompactCategoryLabel(category: FeeItemCategory) {
  switch (category) {
    case 'monthly_membership':
      return 'Member';
    case 'annual_fee':
      return 'Annual';
    case 'signup_fee':
      return 'Signup';
    case 'locker_fee':
      return 'Locker';
    case 'pt':
      return 'PT';
    case 'other':
      return 'Other';
    default:
      return formatCostItemCategory(category);
  }
}

function getFieldError(
  errors: ValidationIssue[] | undefined,
  field: keyof FeeItemFormValues,
) {
  return errors?.find(issue => issue.field === field)?.message;
}

function getCombinedErrorMessage(errors: ValidationIssue[] | undefined) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return errors.map(issue => issue.message).join(' · ');
}

function getNextOptionValue<Value extends string>(
  options: CompactOption<Value>[],
  selectedValue: Value,
) {
  const currentIndex = options.findIndex(option => option.value === selectedValue);

  if (currentIndex < 0) {
    return options[0]?.value ?? selectedValue;
  }

  return options[(currentIndex + 1) % options.length]?.value ?? selectedValue;
}

const FloatingCompactInput = memo(function FloatingCompactInput({
  containerStyle,
  errorMessage,
  keyboardType,
  label,
  onChangeText,
  value,
}: {
  containerStyle?: object;
  errorMessage?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = isFocused || value.trim().length > 0;

  return (
    <View style={containerStyle}>
      <View
        style={[
          styles.fieldShell,
          {
            backgroundColor: theme.colors.surface,
            borderColor: errorMessage
              ? theme.colors.danger
              : isFocused
                ? theme.colors.accent
                : theme.colors.border,
            borderRadius: theme.radius.sm,
          },
        ]}>
        {shouldFloat ? (
          <Text
            style={[
              styles.floatingLabel,
              {
                backgroundColor: theme.colors.surface,
                color: errorMessage ? theme.colors.danger : theme.colors.textMuted,
              },
            ]}>
            {label}
          </Text>
        ) : null}
        <TextInput
          blurOnSubmit={false}
          keyboardType={keyboardType}
          onBlur={() => {
            setIsFocused(false);
          }}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsFocused(true);
          }}
          placeholder={shouldFloat ? '' : label}
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
          style={[
            styles.fieldInput,
            shouldFloat ? styles.fieldInputFloating : styles.fieldInputResting,
            {
              color: theme.colors.textPrimary,
            },
          ]}
          value={value}
        />
      </View>
    </View>
  );
});

function CompactCycleField<Value extends string>({
  containerStyle,
  errorMessage,
  label,
  onChange,
  options,
  selectedValue,
}: {
  containerStyle?: object;
  errorMessage?: string;
  label: string;
  onChange: (value: Value) => void;
  options: CompactOption<Value>[];
  selectedValue: Value;
}) {
  const theme = useAppTheme();
  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <Pressable
      accessibilityHint="Tap to cycle options"
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${selectedOption?.label ?? '-'}`}
      onPress={() => {
        onChange(getNextOptionValue(options, selectedValue));
      }}
      style={({ pressed }) => [
        containerStyle,
        styles.fieldShell,
        {
          backgroundColor: theme.colors.surface,
          borderColor: errorMessage ? theme.colors.danger : theme.colors.border,
          borderRadius: theme.radius.sm,
          opacity: pressed ? 0.78 : 1,
        },
      ]}>
      <Text style={[styles.staticLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.staticValue, { color: theme.colors.textPrimary }]}>
        {selectedOption?.label ?? '-'}
      </Text>
    </Pressable>
  );
}

function CompactDropdownField<Value extends string>({
  containerStyle,
  errorMessage,
  isOpen,
  label,
  onChange,
  onToggle,
  options,
  selectedValue,
}: {
  containerStyle?: object;
  errorMessage?: string;
  isOpen: boolean;
  label: string;
  onChange: (value: Value) => void;
  onToggle: () => void;
  options: CompactOption<Value>[];
  selectedValue: Value;
}) {
  const theme = useAppTheme();
  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <View style={containerStyle}>
      <Pressable
        accessibilityHint="Tap to open options"
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedOption?.label ?? '-'}`}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.fieldShell,
          {
            backgroundColor: theme.colors.surface,
            borderColor: errorMessage
              ? theme.colors.danger
              : isOpen
                ? theme.colors.accent
                : theme.colors.border,
            borderRadius: theme.radius.sm,
            opacity: pressed ? 0.78 : 1,
          },
        ]}>
        <Text style={[styles.staticLabel, { color: theme.colors.textMuted }]}>
          {label}
        </Text>
        <View style={styles.dropdownTriggerRow}>
          <Text style={[styles.staticValue, { color: theme.colors.textPrimary }]}>
            {selectedOption?.label ?? '-'}
          </Text>
          <Text style={[styles.dropdownCaret, { color: theme.colors.textMuted }]}>
            {isOpen ? '▲' : '▼'}
          </Text>
        </View>
      </Pressable>

      {isOpen ? (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.sm,
            },
          ]}>
          {options.map(option => {
            const isSelected = option.value === selectedValue;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => {
                  onChange(option.value);
                  onToggle();
                }}
                style={({ pressed }) => [
                  styles.dropdownOption,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.surfaceMuted
                      : theme.colors.surface,
                    opacity: pressed ? 0.76 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.dropdownOptionLabel,
                    {
                      color: isSelected
                        ? theme.colors.accent
                        : theme.colors.textPrimary,
                    },
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function InlineMetaChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'accent' | 'danger' | 'neutral' | 'warning';
}) {
  const theme = useAppTheme();

  const colorMap = {
    accent: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.accent,
      textColor: theme.colors.accent,
    },
    danger: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.danger,
      textColor: theme.colors.danger,
    },
    neutral: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      textColor: theme.colors.textMuted,
    },
    warning: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.warning,
      textColor: theme.colors.warning,
    },
  } as const;

  const palette = colorMap[tone];

  return (
    <View
      style={[
        styles.inlineChip,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderRadius: theme.radius.pill,
        },
      ]}>
      <Text style={[styles.inlineChipLabel, { color: palette.textColor }]}>
        {label}
      </Text>
    </View>
  );
}

const CostSetupLineRow = memo(function CostSetupLineRow({
  line,
  onRemoveCustomLine,
  onSetLineFieldValue,
  onToggleLineAdvanced,
  validationErrors,
}: {
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
  const [openDropdown, setOpenDropdown] = useState<null | 'cadence' | 'tax'>(
    null,
  );
  const amountIsBlank = line.formValues.amountPreTax.trim().length === 0;
  const combinedErrorMessage = getCombinedErrorMessage(validationErrors);
  const rowLabelPlaceholder =
    line.kind === 'starter'
      ? preset?.title ?? preset?.defaultLabel ?? 'Label'
      : 'Label';

  const secondaryRowContent = useMemo(() => {
    const cells: React.ReactNode[] = [];

    if (line.kind === 'custom') {
      cells.push(
        <CompactCycleField
          key={`${line.draftId}_category`}
          containerStyle={styles.advancedCategoryField}
          errorMessage={getFieldError(validationErrors, 'category')}
          label="Type"
          onChange={value => {
            onSetLineFieldValue(line.draftId, 'category', value);
          }}
          options={customCategoryOptions}
          selectedValue={(line.formValues.category || 'other') as FeeItemCategory}
        />,
      );
    }

    cells.push(
      <FloatingCompactInput
        key={`${line.draftId}_start`}
        containerStyle={styles.advancedDateField}
        errorMessage={getFieldError(validationErrors, 'startDate')}
        label="Start"
        onChangeText={value => {
          onSetLineFieldValue(line.draftId, 'startDate', value);
        }}
        value={line.formValues.startDate}
      />,
    );

    cells.push(
      <FloatingCompactInput
        key={`${line.draftId}_end`}
        containerStyle={styles.advancedDateField}
        errorMessage={getFieldError(validationErrors, 'endDate')}
        label="End"
        onChangeText={value => {
          onSetLineFieldValue(line.draftId, 'endDate', value);
        }}
        value={line.formValues.endDate}
      />,
    );

    if (shouldShowBillingAnchorDate(line.formValues.cadence)) {
      cells.push(
        <FloatingCompactInput
          key={`${line.draftId}_anchor`}
          containerStyle={styles.advancedDateField}
          errorMessage={getFieldError(validationErrors, 'billingAnchorDate')}
          label="Anchor"
          onChangeText={value => {
            onSetLineFieldValue(line.draftId, 'billingAnchorDate', value);
          }}
          value={line.formValues.billingAnchorDate}
        />,
      );
    }

    if (line.formValues.amountInputMode === 'custom') {
      cells.push(
        <FloatingCompactInput
          key={`${line.draftId}_gst`}
          containerStyle={styles.taxField}
          errorMessage={getFieldError(validationErrors, 'taxMode')}
          keyboardType="decimal-pad"
          label="GST"
          onChangeText={value => {
            onSetLineFieldValue(line.draftId, 'gstRate', value);
          }}
          value={line.formValues.gstRate}
        />,
      );
      cells.push(
        <FloatingCompactInput
          key={`${line.draftId}_pst`}
          containerStyle={styles.taxField}
          errorMessage={getFieldError(validationErrors, 'taxMode')}
          keyboardType="decimal-pad"
          label="PST"
          onChangeText={value => {
            onSetLineFieldValue(line.draftId, 'pstRate', value);
          }}
          value={line.formValues.pstRate}
        />,
      );
    }

    return cells;
  }, [line, onSetLineFieldValue, validationErrors]);

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.primaryRow}>
        <FloatingCompactInput
          containerStyle={styles.labelField}
          errorMessage={getFieldError(validationErrors, 'label')}
          label={rowLabelPlaceholder}
          onChangeText={value => {
            onSetLineFieldValue(line.draftId, 'label', value);
          }}
          value={line.formValues.label}
        />
        <FloatingCompactInput
          containerStyle={styles.amountField}
          errorMessage={getFieldError(validationErrors, 'amountPreTax')}
          keyboardType="decimal-pad"
          label="Amount"
          onChangeText={value => {
            onSetLineFieldValue(line.draftId, 'amountPreTax', value);
          }}
          value={line.formValues.amountPreTax}
        />
        <CompactDropdownField
          containerStyle={styles.inlineChoiceField}
          errorMessage={getFieldError(validationErrors, 'cadence')}
          isOpen={openDropdown === 'cadence'}
          label="Every"
          onChange={value => {
            onSetLineFieldValue(line.draftId, 'cadence', value);
          }}
          onToggle={() => {
            setOpenDropdown(currentValue =>
              currentValue === 'cadence' ? null : 'cadence',
            );
          }}
          options={cadenceOptions}
          selectedValue={(line.formValues.cadence ||
            preset?.defaultCadence ||
            'monthly') as Exclude<(typeof feeItemCadences)[number], 'custom'>}
        />
        <CompactDropdownField
          containerStyle={styles.inlineChoiceField}
          errorMessage={getFieldError(validationErrors, 'amountInputMode')}
          isOpen={openDropdown === 'tax'}
          label="Tax"
          onChange={value => {
            onSetLineFieldValue(line.draftId, 'amountInputMode', value);
          }}
          onToggle={() => {
            setOpenDropdown(currentValue =>
              currentValue === 'tax' ? null : 'tax',
            );
          }}
          options={amountModeOptions}
          selectedValue={line.formValues.amountInputMode}
        />
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.secondaryRow}>
        {line.existingFeeItemId ? <InlineMetaChip label="Saved" tone="accent" /> : null}
        {line.existingFeeItemId && amountIsBlank ? (
          <InlineMetaChip label="Blank amount deactivates" tone="warning" />
        ) : null}
        {combinedErrorMessage ? (
          <InlineMetaChip label={combinedErrorMessage} tone="danger" />
        ) : null}
        {line.showAdvanced ? secondaryRowContent : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onToggleLineAdvanced(line.draftId);
          }}
          style={({ pressed }) => [
            styles.inlineAction,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.pill,
              opacity: pressed ? 0.72 : 1,
            },
          ]}>
          <Text style={[styles.inlineActionLabel, { color: theme.colors.accent }]}>
            {line.showAdvanced ? 'Less' : 'More'}
          </Text>
        </Pressable>
        {line.kind === 'custom' && !line.existingFeeItemId ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onRemoveCustomLine(line.draftId);
            }}
            style={({ pressed }) => [
              styles.inlineAction,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.pill,
                opacity: pressed ? 0.72 : 1,
              },
            ]}>
            <Text style={[styles.inlineActionLabel, { color: theme.colors.danger }]}>
              Remove
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
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
            ? [primaryGymName ?? 'Primary gym', appSettings?.currency]
                .filter(Boolean)
                .join(' · ')
            : 'Set a primary gym first'}
        </Text>
        <PrimaryButton
          disabled={supportState === 'loading' || saveState === 'saving'}
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
            marginTop: theme.spacing.md,
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
    minHeight: 42,
    paddingHorizontal: 12,
  },
  addLineLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  advancedCategoryField: {
    width: 110,
  },
  advancedDateField: {
    width: 92,
  },
  amountField: {
    width: 98,
  },
  dropdownCaret: {
    fontSize: 10,
    lineHeight: 12,
  },
  dropdownMenu: {
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownOption: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  dropdownTriggerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingRight: 10,
  },
  fieldInput: {
    fontSize: 14,
    lineHeight: 18,
    minHeight: 52,
    paddingBottom: 6,
    paddingHorizontal: 12,
  },
  fieldInputFloating: {
    paddingTop: 24,
  },
  fieldInputResting: {
    paddingTop: 14,
  },
  fieldShell: {
    borderWidth: 1,
    minHeight: 52,
    position: 'relative',
  },
  floatingLabel: {
    fontSize: 11,
    fontWeight: '600',
    left: 12,
    lineHeight: 14,
    position: 'absolute',
    top: 6,
    zIndex: 1,
  },
  inlineAction: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 12,
  },
  inlineActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  inlineChoiceField: {
    width: 76,
  },
  inlineChip: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  inlineChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  labelField: {
    width: 148,
  },
  primaryRow: {
    alignItems: 'flex-start',
    gap: 8,
  },
  rowCard: {
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  rowStack: {
    gap: 10,
    marginTop: 12,
  },
  secondaryRow: {
    alignItems: 'center',
    gap: 8,
  },
  staticLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  staticValue: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  taxField: {
    width: 72,
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
