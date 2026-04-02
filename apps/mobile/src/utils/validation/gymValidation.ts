import type { GymFormValues } from '../../domain/forms';
import { gymRadiusMetersLimits } from '../../domain/constants';

import { createValidationResult, isBlank, parseNumericInput } from './common';
import { validationMessages } from './messages';
import type { ValidationIssue } from './types';

export type GymFormField = keyof GymFormValues;

function isValidTimezone(value: string) {
  try {
    Intl.DateTimeFormat('en-CA', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function validateGymForm(values: GymFormValues) {
  const issues: ValidationIssue<GymFormField>[] = [];
  const latitude = parseNumericInput(values.latitude);
  const longitude = parseNumericInput(values.longitude);
  const radiusMeters = parseNumericInput(values.radiusMeters);

  if (isBlank(values.name)) {
    issues.push({
      code: 'gym.name.required',
      field: 'name',
      message: validationMessages.gym.nameRequired,
      severity: 'error',
    });
  }

  if (latitude === null || latitude < -90 || latitude > 90) {
    issues.push({
      code: 'gym.latitude.invalid',
      field: 'latitude',
      message: validationMessages.gym.invalidLatitude,
      severity: 'error',
    });
  }

  if (longitude === null || longitude < -180 || longitude > 180) {
    issues.push({
      code: 'gym.longitude.invalid',
      field: 'longitude',
      message: validationMessages.gym.invalidLongitude,
      severity: 'error',
    });
  }

  if (radiusMeters === null) {
    issues.push({
      code: 'gym.radius.not_numeric',
      field: 'radiusMeters',
      message: validationMessages.gym.radiusMustBeNumeric,
      severity: 'error',
    });
  } else if (
    radiusMeters < gymRadiusMetersLimits.min ||
    radiusMeters > gymRadiusMetersLimits.max
  ) {
    issues.push({
      code: 'gym.radius.out_of_range',
      field: 'radiusMeters',
      message: validationMessages.gym.radiusOutOfRange,
      severity: 'error',
    });
  }

  if (isBlank(values.timezone) || !isValidTimezone(values.timezone.trim())) {
    issues.push({
      code: 'gym.timezone.invalid',
      field: 'timezone',
      message: validationMessages.gym.invalidTimezone,
      severity: 'error',
    });
  }

  return createValidationResult(issues);
}
