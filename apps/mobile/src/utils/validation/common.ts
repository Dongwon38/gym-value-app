import type { ValidationIssue, ValidationResult } from './types';

export function isBlank(value: string) {
  return value.trim().length === 0;
}

export function createValidationResult<Field extends string = string>(
  issues: ValidationIssue<Field>[],
): ValidationResult<Field> {
  return { issues };
}

export function getValidationErrors<Field extends string = string>(
  result: ValidationResult<Field>,
) {
  return result.issues.filter(issue => issue.severity === 'error');
}

export function getValidationWarnings<Field extends string = string>(
  result: ValidationResult<Field>,
) {
  return result.issues.filter(issue => issue.severity === 'warning');
}

export function hasValidationErrors<Field extends string = string>(
  result: ValidationResult<Field>,
) {
  return getValidationErrors(result).length > 0;
}

export function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function isValidTimeOfDay(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(':').map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return false;
  }

  return true;
}

export function buildLocalDateTime(date: string, time: string) {
  if (!isValidDateOnly(date) || !isValidTimeOfDay(time)) {
    return null;
  }

  const parsed = new Date(`${date}T${time}:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function parseNumericInput(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  const parsed = Number(trimmedValue);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}
