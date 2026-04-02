import { createVisit, updateVisit } from '../../../data/repositories';
import type { VisitFormValues } from '../../../domain/forms';
import type { Visit } from '../../../domain/models';
import {
  buildLocalDateTime,
  getValidationErrors,
  validateVisitForm,
} from '../../../utils/validation';
import type { ValidationIssue } from '../../../utils/validation';

export class VisitFormValidationError extends Error {
  issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super('Visit form validation failed.');
    this.issues = issues;
  }
}

export function deriveCompletedVisitDurationMinutes(values: Pick<VisitFormValues, 'date' | 'endedAt' | 'startedAt'>) {
  const startedAt = buildLocalDateTime(values.date, values.startedAt);
  const endedAt = buildLocalDateTime(values.date, values.endedAt);

  if (!startedAt || !endedAt) {
    return null;
  }

  return Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);
}

type SaveVisitOptions = {
  existingVisit?: Pick<Visit, 'id'> | null;
  gymId: string;
};

export async function saveVisit(
  values: VisitFormValues,
  { existingVisit, gymId }: SaveVisitOptions,
) {
  const completedValues = {
    ...values,
    gymId,
    status: 'completed' as const,
  };
  const validationResult = validateVisitForm(completedValues);
  const errors = getValidationErrors(validationResult);

  if (errors.length > 0) {
    throw new VisitFormValidationError(errors);
  }

  const startedAtDate = buildLocalDateTime(completedValues.date, completedValues.startedAt);
  const endedAtDate = buildLocalDateTime(completedValues.date, completedValues.endedAt);
  const durationMinutes = deriveCompletedVisitDurationMinutes(completedValues);

  if (!startedAtDate || !endedAtDate || durationMinutes === null) {
    throw new Error('Visit times could not be derived after validation.');
  }

  const input = {
    durationMinutes,
    endedAt: endedAtDate.toISOString(),
    gymId,
    notes: completedValues.notes.trim() || null,
    startedAt: startedAtDate.toISOString(),
    status: 'completed' as const,
  };

  if (existingVisit?.id) {
    return updateVisit(existingVisit.id, input);
  }

  return createVisit(input);
}
