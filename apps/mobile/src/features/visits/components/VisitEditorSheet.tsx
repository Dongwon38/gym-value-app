import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VisitFormStatus, VisitFormValues } from '../../../domain/forms';
import type { ValidationIssue } from '../../../utils/validation';
import { BottomSheet, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { formatVisitDurationLabel } from '../useCases/visitTimeline';

type VisitEditorSheetProps = {
  deleteDisabled?: boolean;
  deleteLabel?: string;
  derivedDurationMinutes: number | null;
  editorMode: 'create' | 'edit';
  formValues: VisitFormValues;
  hasPrimaryGym: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onSave: () => void;
  onSetFieldValue: <Field extends keyof VisitFormValues>(
    field: Field,
    value: VisitFormValues[Field],
  ) => void;
  primaryGymName?: string;
  saveFeedback: string | null;
  saveState: 'idle' | 'saving' | 'success' | 'error';
  validationErrors: ValidationIssue[];
  visitSourceLabel: string;
  visible: boolean;
};

function getFieldError(errors: ValidationIssue[], field: keyof VisitFormValues) {
  return errors.find(issue => issue.field === field)?.message;
}

function formatSheetTimeRange(values: Pick<VisitFormValues, 'endedAt' | 'startedAt' | 'status'>) {
  if (!values.startedAt) {
    return '--';
  }

  if (values.status === 'active') {
    return `${values.startedAt} - Active`;
  }

  if (!values.endedAt) {
    return `${values.startedAt} - --`;
  }

  return `${values.startedAt} - ${values.endedAt}`;
}

function formatSheetDuration(
  derivedDurationMinutes: number | null,
  status: VisitFormStatus,
) {
  if (status === 'active') {
    return 'In progress';
  }

  if (derivedDurationMinutes === null || derivedDurationMinutes <= 0) {
    return '--';
  }

  return formatVisitDurationLabel(derivedDurationMinutes);
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

function StatusSegment({
  onChange,
  selectedStatus,
}: {
  onChange: (status: VisitFormStatus) => void;
  selectedStatus: VisitFormStatus;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.segmentedControl,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.pill,
        },
      ]}>
      {[
        { label: 'Completed', value: 'completed' as const },
        { label: 'Active', value: 'active' as const },
      ].map(option => {
        const isSelected = option.value === selectedStatus;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => {
              onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.segmentOption,
              {
                backgroundColor: isSelected
                  ? theme.colors.surface
                  : 'transparent',
                borderRadius: theme.radius.pill,
                opacity: pressed ? 0.82 : 1,
              },
            ]}>
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: isSelected
                    ? theme.colors.textPrimary
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

export function VisitEditorSheet({
  deleteDisabled = false,
  deleteLabel = 'Delete Visit',
  derivedDurationMinutes,
  editorMode,
  formValues,
  hasPrimaryGym,
  onClose,
  onDelete,
  onSave,
  onSetFieldValue,
  primaryGymName,
  saveFeedback,
  saveState,
  validationErrors,
  visitSourceLabel,
  visible,
}: VisitEditorSheetProps) {
  const theme = useAppTheme();

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
        disabled={saveState === 'saving'}
        label={saveState === 'saving' ? 'Saving...' : 'Save'}
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
        hasPrimaryGym
          ? primaryGymName ?? 'Primary gym'
          : 'Set up a primary gym in Settings before saving a new visit.'
      }
      title={editorMode === 'edit' ? 'Edit Visit' : 'Add Visit'}
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

      <View
        style={[
          styles.summaryPanel,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}>
        <SummaryRow label="Date" value={formValues.date || '--'} />
        <SummaryRow label="Time" value={formatSheetTimeRange(formValues)} />
        <SummaryRow
          label="Duration"
          value={formatSheetDuration(derivedDurationMinutes, formValues.status)}
        />
        <SummaryRow label="Type" value={visitSourceLabel} />
      </View>

      <StatusSegment
        onChange={status => {
          onSetFieldValue('status', status);

          if (status === 'active') {
            onSetFieldValue('endedAt', '');
          }
        }}
        selectedStatus={formValues.status}
      />

      <View style={styles.twoColumnRow}>
        <View style={styles.flexField}>
          <TextField
            dense
            errorMessage={getFieldError(validationErrors, 'date')}
            label="Date"
            onChangeText={value => {
              onSetFieldValue('date', value);
            }}
            placeholder="2026-04-03"
            value={formValues.date}
          />
        </View>
        <View style={styles.flexField}>
          <TextField
            dense
            errorMessage={getFieldError(validationErrors, 'startedAt')}
            label="Start"
            onChangeText={value => {
              onSetFieldValue('startedAt', value);
            }}
            placeholder="18:10"
            value={formValues.startedAt}
          />
        </View>
      </View>

      {formValues.status === 'completed' ? (
        <TextField
          dense
          errorMessage={getFieldError(validationErrors, 'endedAt')}
          label="End"
          onChangeText={value => {
            onSetFieldValue('endedAt', value);
          }}
          placeholder="19:25"
          value={formValues.endedAt}
        />
      ) : null}

      <TextField
        dense
        label="Notes"
        multiline
        onChangeText={value => {
          onSetFieldValue('notes', value);
        }}
        placeholder="Optional"
        value={formValues.notes}
      />

      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          disabled={deleteDisabled}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.pill,
              opacity: deleteDisabled ? 0.5 : pressed ? 0.76 : 1,
            },
          ]}>
          <Text style={[styles.deleteButtonLabel, { color: theme.colors.danger }]}>
            {deleteLabel}
          </Text>
        </Pressable>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  deleteButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
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
  primaryFooterButton: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
  segmentedControl: {
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  segmentOption: {
    alignItems: 'center',
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryPanel: {
    borderWidth: 1,
    padding: 16,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
