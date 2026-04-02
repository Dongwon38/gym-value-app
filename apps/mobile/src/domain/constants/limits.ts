export const gymRadiusMetersLimits = {
  max: 500,
  min: 30,
} as const;

export const visitDurationMinutesLimits = {
  minCompleted: 1,
} as const;

export const feeItemAmountPreTaxLimits = {
  min: 0,
} as const;

export const feeItemTaxRateLimits = {
  min: 0,
} as const;

export const maxActiveVisits = 1;
