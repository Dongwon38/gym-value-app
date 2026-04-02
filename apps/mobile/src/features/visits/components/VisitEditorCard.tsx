import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VisitFormStatus, VisitFormValues } from '../../../domain/forms';
import type { ValidationIssue } from '../../../utils/validation';
import { Card, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';

type VisitEditorCardProps = {
  derivedDurationMinutes: number | null;
  editorMode: 'create' | 'edit';
  formValues: VisitFormValues;
  hasPrimaryGym: boolean;
  onClose: () => void;
  onSave: () => void;
  onSetFieldValue: <Field extends keyof VisitFormValues>(
    field: Field,
    value: VisitFormValues[Field],
  ) => void;
  primaryGymName?: string;
  saveFeedback: string | null;
  saveState: 'idle' | 'saving' | 'success' | 'error';
  validationErrors: ValidationIssue[];
};

type ChoiceOption<Value extends string> = {
  description: string;
  label: string;
  value: Value;
};

function getFieldError(errors: ValidationIssue[], field: keyof VisitFormValues) {
  return errors.find(issue => issue.field === field)?.message;
}

function formatDurationPreview(durationMinutes: number | null) {
  if (durationMinutes === null || durationMinutes <= 0) {
    return 'Duration will appear after valid start and end times are entered.';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function ChoicePillGroup<Value extends string>({
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
              key={option.value}
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

export function VisitEditorCard({
  derivedDurationMinutes,
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
}: VisitEditorCardProps) {
  const theme = useAppTheme();
  const statusOptions: ChoiceOption<VisitFormStatus>[] = [
    {
      description: 'Store both start and end time, then derive duration during save.',
      label: 'Completed',
      value: 'completed',
    },
    {
      description: 'Store only the start time for now and keep ended_at empty.',
      label: 'Active',
      value: 'active',
    },
  ];

  return (
    <Card
      subtitle={
        editorMode === 'edit'
          ? 'Update the selected visit. Completed rows re-derive duration, and active rows keep ended_at empty.'
          : 'Create a new manual visit under the current primary gym. Both completed and active visit states are supported here.'
      }
      title={editorMode === 'edit' ? 'Edit visit' : 'Add visit'}>
      <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
        {hasPrimaryGym
          ? `Saving to primary gym: ${primaryGymName ?? 'Unnamed gym'}.`
          : 'A primary gym is required before visits can be saved.'}
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
        <ChoicePillGroup
          label="Visit status"
          onChange={value => {
            onSetFieldValue('status', value);
          }}
          options={statusOptions}
          selectedValue={formValues.status}
        />

        <TextField
          errorMessage={getFieldError(validationErrors, 'date')}
          helperText="YYYY-MM-DD"
          label="Visit date"
          onChangeText={value => {
            onSetFieldValue('date', value);
          }}
          placeholder="2026-04-02"
          value={formValues.date}
        />

        <View style={styles.inlineFields}>
          <View style={styles.inlineField}>
            <TextField
              errorMessage={getFieldError(validationErrors, 'startedAt')}
              helperText="24-hour format"
              label="Start time"
              onChangeText={value => {
                onSetFieldValue('startedAt', value);
              }}
              placeholder="10:00"
              value={formValues.startedAt}
            />
          </View>
          {formValues.status === 'completed' ? (
            <View style={styles.inlineField}>
              <TextField
                errorMessage={getFieldError(validationErrors, 'endedAt')}
                helperText="24-hour format"
                label="End time"
                onChangeText={value => {
                  onSetFieldValue('endedAt', value);
                }}
                placeholder="11:15"
                value={formValues.endedAt}
              />
            </View>
          ) : null}
        </View>

        <TextField
          helperText="Optional. Use this for notes like leg day, cardio, or class name."
          label="Notes"
          multiline
          onChangeText={value => {
            onSetFieldValue('notes', value);
          }}
          placeholder="Upper body and incline walk"
          value={formValues.notes}
        />

        {formValues.status === 'completed' ? (
          <Card
            subtitle="The app stores only started_at and ended_at. duration_minutes is derived during save."
            title="Derived duration preview">
            <Text style={[styles.meta, { color: theme.colors.textPrimary }]}>
              {formatDurationPreview(derivedDurationMinutes)}
            </Text>
          </Card>
        ) : (
          <Card
            subtitle="An active visit keeps ended_at and duration_minutes empty until the visit is updated to completed."
            title="Active visit behavior">
            <Text style={[styles.meta, { color: theme.colors.textPrimary }]}>
              Save this row with a start time only. The single active-visit rule is enforced before write.
            </Text>
          </Card>
        )}
      </View>

      <View style={[styles.actions, { marginTop: theme.spacing.xl }]}>
        <PrimaryButton
          disabled={saveState === 'saving'}
          label={
            saveState === 'saving'
              ? 'Saving Visit...'
              : editorMode === 'edit'
                ? 'Save Visit Changes'
                : 'Create Visit'
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
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  choiceDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  choiceLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  choices: {
    gap: 12,
  },
  feedback: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 12,
  },
  field: {
    gap: 10,
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
