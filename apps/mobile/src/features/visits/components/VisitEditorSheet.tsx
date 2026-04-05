import React from 'react';
import { View } from 'react-native';

import type { VisitFormStatus, VisitFormValues } from '../../../domain/forms';
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
  return (
    <Row justify="between">
      <Text tone="secondary" variant="bodyMuted">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </Row>
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
  return (
    <BottomSheetFormShell
      footer={
        <Row className="gap-3">
          <Button className="flex-1" label="Cancel" onPress={onClose} variant="secondary" />
          <Button
            className="flex-1"
            disabled={saveState === 'saving'}
            label={saveState === 'saving' ? 'Saving...' : 'Save'}
            onPress={onSave}
          />
        </Row>
      }
      onClose={onClose}
      subtitle={
        hasPrimaryGym
          ? primaryGymName ?? 'Primary gym'
          : 'Set up a primary gym in Settings before saving a new visit.'
      }
      title={editorMode === 'edit' ? 'Edit Visit' : 'Add Visit'}
      visible={visible}>
      {saveFeedback ? (
        <Text tone={saveState === 'error' ? 'destructive' : 'success'} variant="bodyMuted">
          {saveFeedback}
        </Text>
      ) : null}

      <Card padding="compact" shadow="none" variant="muted">
        <View className="gap-3">
          <SummaryRow label="Date" value={formValues.date || '--'} />
          <SummaryRow label="Time" value={formatSheetTimeRange(formValues)} />
          <SummaryRow
            label="Duration"
            value={formatSheetDuration(derivedDurationMinutes, formValues.status)}
          />
          <SummaryRow label="Type" value={visitSourceLabel} />
        </View>
      </Card>

      <SegmentedControl
        onChange={status => {
          onSetFieldValue('status', status);

          if (status === 'active') {
            onSetFieldValue('endedAt', '');
          }
        }}
        options={[
          { label: 'Completed', value: 'completed' as const },
          { label: 'Active', value: 'active' as const },
        ]}
        value={formValues.status}
      />

      <Row align="start" className="gap-3">
        <View className="flex-1">
          <Input
            errorText={getFieldError(validationErrors, 'date')}
            keyboardType="numbers-and-punctuation"
            label="Date"
            onChangeText={value => {
              onSetFieldValue('date', value);
            }}
            placeholder="2026-04-04"
            value={formValues.date}
          />
        </View>
        <View className="flex-1">
          <Input
            errorText={getFieldError(validationErrors, 'startedAt')}
            keyboardType="numbers-and-punctuation"
            label="Start"
            onChangeText={value => {
              onSetFieldValue('startedAt', value);
            }}
            placeholder="18:10"
            value={formValues.startedAt}
          />
        </View>
      </Row>

      <Input
        editable={formValues.status !== 'active'}
        errorText={getFieldError(validationErrors, 'endedAt')}
        keyboardType="numbers-and-punctuation"
        label="End"
        onChangeText={value => {
          onSetFieldValue('endedAt', value);
        }}
        placeholder={formValues.status === 'active' ? 'Disabled while active' : '19:25'}
        value={formValues.endedAt}
      />

      <Card padding="compact" shadow="none" variant="muted">
        <SummaryRow label="Type" value={visitSourceLabel} />
      </Card>

      {onDelete ? (
        <Button
          disabled={deleteDisabled}
          label={deleteDisabled ? 'Working...' : deleteLabel}
          onPress={onDelete}
          variant="destructive"
        />
      ) : null}
    </BottomSheetFormShell>
  );
}
