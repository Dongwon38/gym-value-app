import type { VisitFormValues } from '../../domain/forms';
import {
  maxActiveVisits,
  visitDurationMinutesLimits,
} from '../../domain/constants';

import {
  buildLocalDateTime,
  createValidationResult,
  isBlank,
  isValidDateOnly,
  isValidTimeOfDay,
} from './common';
import { validationMessages } from './messages';
import type { ValidationIssue } from './types';

export type VisitFormField = keyof VisitFormValues;

export interface VisitValidationOptions {
  existingActiveVisits?: number;
  now?: Date;
}

const longVisitWarningMinutes = 12 * 60;

export function validateVisitForm(
  values: VisitFormValues,
  options: VisitValidationOptions = {},
) {
  const issues: ValidationIssue<VisitFormField>[] = [];
  const now = options.now ?? new Date();

  if (isBlank(values.gymId)) {
    issues.push({
      code: 'visit.gym.required',
      field: 'gymId',
      message: validationMessages.visit.gymRequired,
      severity: 'error',
    });
  }

  if (isBlank(values.date)) {
    issues.push({
      code: 'visit.date.required',
      field: 'date',
      message: validationMessages.visit.dateRequired,
      severity: 'error',
    });
  } else if (!isValidDateOnly(values.date)) {
    issues.push({
      code: 'visit.date.invalid',
      field: 'date',
      message: validationMessages.visit.invalidDate,
      severity: 'error',
    });
  }

  if (isBlank(values.startedAt)) {
    issues.push({
      code: 'visit.started_at.required',
      field: 'startedAt',
      message: validationMessages.visit.startedAtRequired,
      severity: 'error',
    });
  } else if (!isValidTimeOfDay(values.startedAt)) {
    issues.push({
      code: 'visit.started_at.invalid',
      field: 'startedAt',
      message: validationMessages.visit.invalidStartedAt,
      severity: 'error',
    });
  }

  if (values.status === 'completed' && isBlank(values.endedAt)) {
    issues.push({
      code: 'visit.ended_at.required',
      field: 'endedAt',
      message: validationMessages.visit.endedAtRequired,
      severity: 'error',
    });
  } else if (!isBlank(values.endedAt) && !isValidTimeOfDay(values.endedAt)) {
    issues.push({
      code: 'visit.ended_at.invalid',
      field: 'endedAt',
      message: validationMessages.visit.invalidEndedAt,
      severity: 'error',
    });
  }

  const startedAtDate = buildLocalDateTime(values.date, values.startedAt);
  const endedAtDate = isBlank(values.endedAt)
    ? null
    : buildLocalDateTime(values.date, values.endedAt);

  if (startedAtDate && startedAtDate.getTime() > now.getTime()) {
    issues.push({
      code: 'visit.started_at.future',
      field: 'startedAt',
      message: validationMessages.visit.futureVisitNotAllowed,
      severity: 'error',
    });
  }

  if (values.status === 'completed' && endedAtDate) {
    if (endedAtDate.getTime() > now.getTime()) {
      issues.push({
        code: 'visit.ended_at.future',
        field: 'endedAt',
        message: validationMessages.visit.futureVisitNotAllowed,
        severity: 'error',
      });
    }

    if (startedAtDate && endedAtDate.getTime() <= startedAtDate.getTime()) {
      issues.push({
        code: 'visit.ended_at.before_started_at',
        field: 'endedAt',
        message: validationMessages.visit.endedAtMustBeAfterStartedAt,
        severity: 'error',
      });
    }

    if (startedAtDate && endedAtDate.getTime() > startedAtDate.getTime()) {
      const durationMinutes =
        (endedAtDate.getTime() - startedAtDate.getTime()) / 60000;

      if (durationMinutes < visitDurationMinutesLimits.minCompleted) {
        issues.push({
          code: 'visit.duration.non_positive',
          field: 'endedAt',
          message: validationMessages.visit.positiveDurationRequired,
          severity: 'error',
        });
      }

      if (durationMinutes > longVisitWarningMinutes) {
        issues.push({
          code: 'visit.duration.long_warning',
          field: 'endedAt',
          message: validationMessages.visit.longVisitWarning,
          severity: 'warning',
        });
      }
    }
  }

  if (
    values.status === 'active' &&
    (options.existingActiveVisits ?? 0) >= maxActiveVisits
  ) {
    issues.push({
      code: 'visit.active_visit.exists',
      field: 'status',
      message: validationMessages.visit.activeVisitAlreadyExists,
      severity: 'error',
    });
  }

  return createValidationResult(issues);
}
