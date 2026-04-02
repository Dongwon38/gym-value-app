export const validationIssueSeverities = ['error', 'warning'] as const;
export type ValidationIssueSeverity =
  (typeof validationIssueSeverities)[number];

export interface ValidationIssue<Field extends string = string> {
  code: string;
  field: Field | 'form';
  message: string;
  severity: ValidationIssueSeverity;
}

export interface ValidationResult<Field extends string = string> {
  issues: ValidationIssue<Field>[];
}
