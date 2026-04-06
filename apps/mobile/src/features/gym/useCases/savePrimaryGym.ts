import type { GymFormValues } from '../../../domain/forms';
import { getValidationErrors, parseNumericInput, validateGymForm } from '../../../utils/validation';
import { createGym, updateGym } from '../../../data/repositories';
import type { ValidationIssue } from '../../../utils/validation';

export class GymFormValidationError extends Error {
  issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super('Gym form validation failed.');
    this.issues = issues;
  }
}

export async function savePrimaryGym(
  values: GymFormValues,
  existingGymId?: string,
) {
  const validationResult = validateGymForm(values);
  const errors = getValidationErrors(validationResult);

  if (errors.length > 0) {
    throw new GymFormValidationError(errors);
  }

  const latitude = parseNumericInput(values.latitude);
  const longitude = parseNumericInput(values.longitude);
  const radiusMeters = parseNumericInput(values.radiusMeters);

  if (latitude === null || longitude === null || radiusMeters === null) {
    throw new Error('Gym form values could not be parsed after validation.');
  }

  const input = {
    isActive: true,
    isPrimary: true,
    latitude,
    longitude,
    name: values.name.trim(),
    radiusMeters: Math.round(radiusMeters),
    searchSource: 'manual' as const,
    timezone: values.timezone.trim(),
  };

  if (existingGymId) {
    return updateGym(existingGymId, input);
  }

  return createGym(input);
}
