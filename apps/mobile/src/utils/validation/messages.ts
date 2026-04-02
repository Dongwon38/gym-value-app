export const validationMessages = {
  feeItem: {
    amountMustBeNonNegative: 'Enter an amount that is 0 or greater.',
    cadenceRequired: 'Select a valid cadence.',
    customCadenceNotSupported:
      'Custom cadence is not supported in v0.1. Choose one-time, monthly, or annual.',
    customTaxRatesRequired:
      'Enter both GST and PST rates when using custom tax.',
    endDateMustBeOnOrAfterStartDate:
      'End date must be on or after the start date.',
    invalidDate: 'Enter a valid date.',
    invalidTaxRate: 'Enter a tax rate that is 0 or greater.',
    labelRequired: 'Enter a label for this cost item.',
    startDateRequired: 'Enter a start date.',
    validCategoryRequired: 'Select a valid cost category.',
  },
  gym: {
    invalidLatitude: 'Enter a latitude between -90 and 90.',
    invalidLongitude: 'Enter a longitude between -180 and 180.',
    invalidTimezone: 'Enter a valid IANA timezone.',
    nameRequired: 'Enter a gym name.',
    radiusMustBeNumeric: 'Enter a numeric radius in meters.',
    radiusOutOfRange:
      'Radius must be between 30m and 500m for v0.1 gym setup.',
  },
  visit: {
    activeVisitAlreadyExists:
      'You already have an active visit. End it before starting another one.',
    dateRequired: 'Enter a visit date.',
    endedAtMustBeAfterStartedAt: 'End time must be after start time.',
    endedAtRequired: 'Enter an end time for a completed visit.',
    futureVisitNotAllowed: 'Visit times cannot be in the future.',
    gymRequired: 'Select a gym before saving a visit.',
    invalidDate: 'Enter a valid visit date.',
    invalidEndedAt: 'Enter a valid end time.',
    invalidStartedAt: 'Enter a valid start time.',
    longVisitWarning:
      'This visit is longer than 12 hours. Review the time range before saving.',
    positiveDurationRequired: 'Visit duration must be greater than 0 minutes.',
    startedAtRequired: 'Enter a start time.',
  },
} as const;
