import { createVisit, getActiveVisit, updateVisit } from '../../../data/repositories';
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
  const conflictingActiveVisit =
    values.status === 'active' ? await getActiveVisit() : null;
  const normalizedValues = {
    ...values,
    gymId,
  };
  const validationResult = validateVisitForm(normalizedValues, {
    existingActiveVisits:
      conflictingActiveVisit &&
      conflictingActiveVisit.id !== existingVisit?.id
        ? 1
        : 0,
  });
  const errors = getValidationErrors(validationResult);

  if (errors.length > 0) {
    throw new VisitFormValidationError(errors);
  }

  const startedAtDate = buildLocalDateTime(
    normalizedValues.date,
    normalizedValues.startedAt,
  );

  if (!startedAtDate) {
    throw new Error('Visit start time could not be derived after validation.');
  }

  if (normalizedValues.status === 'active') {
    const activeInput = {
      durationMinutes: null,
      endedAt: null,
      gymId,
      notes: normalizedValues.notes.trim() || null,
      startedAt: startedAtDate.toISOString(),
      status: 'active' as const,
    };

    if (existingVisit?.id) {
      return updateVisit(existingVisit.id, activeInput);
    }

    return createVisit(activeInput);
  }

  const endedAtDate = buildLocalDateTime(
    normalizedValues.date,
    normalizedValues.endedAt,
  );
  const durationMinutes = deriveCompletedVisitDurationMinutes(normalizedValues);

  if (!endedAtDate || durationMinutes === null) {
    throw new Error('Visit times could not be derived after validation.');
  }

  const completedInput = {
    durationMinutes,
    endedAt: endedAtDate.toISOString(),
    gymId,
    notes: normalizedValues.notes.trim() || null,
    startedAt: startedAtDate.toISOString(),
    status: 'completed' as const,
  };

  if (existingVisit?.id) {
    return updateVisit(existingVisit.id, completedInput);
  }

  return createVisit(completedInput);
}
