import type { FeeItemFormValues } from '../../domain/forms';
import {
  feeItemAmountPreTaxLimits,
  feeItemTaxRateLimits,
} from '../../domain/constants';
import {
  feeItemCadencesForV01,
  feeItemCategories,
  feeItemTaxModes,
} from '../../domain/models';

import {
  createValidationResult,
  isBlank,
  isValidDateOnly,
  parseNumericInput,
} from './common';
import { validationMessages } from './messages';
import type { ValidationIssue } from './types';

export type FeeItemFormField = keyof FeeItemFormValues;

export function validateFeeItemForm(values: FeeItemFormValues) {
  const issues: ValidationIssue<FeeItemFormField>[] = [];
  const amountPreTax = parseNumericInput(values.amountPreTax);
  const gstRate = parseNumericInput(values.gstRate);
  const pstRate = parseNumericInput(values.pstRate);

  if (isBlank(values.label)) {
    issues.push({
      code: 'fee_item.label.required',
      field: 'label',
      message: validationMessages.feeItem.labelRequired,
      severity: 'error',
    });
  }

  if (values.category === '' || !feeItemCategories.includes(values.category)) {
    issues.push({
      code: 'fee_item.category.invalid',
      field: 'category',
      message: validationMessages.feeItem.validCategoryRequired,
      severity: 'error',
    });
  }

  if (
    values.cadence === '' ||
    !feeItemCadencesForV01.includes(values.cadence)
  ) {
    issues.push({
      code:
        values.cadence === 'custom'
          ? 'fee_item.cadence.custom_not_supported'
          : 'fee_item.cadence.invalid',
      field: 'cadence',
      message:
        values.cadence === 'custom'
          ? validationMessages.feeItem.customCadenceNotSupported
          : validationMessages.feeItem.cadenceRequired,
      severity: 'error',
    });
  }

  if (amountPreTax === null || amountPreTax < feeItemAmountPreTaxLimits.min) {
    issues.push({
      code: 'fee_item.amount.invalid',
      field: 'amountPreTax',
      message: validationMessages.feeItem.amountMustBeNonNegative,
      severity: 'error',
    });
  }

  if (isBlank(values.startDate)) {
    issues.push({
      code: 'fee_item.start_date.required',
      field: 'startDate',
      message: validationMessages.feeItem.startDateRequired,
      severity: 'error',
    });
  } else if (!isValidDateOnly(values.startDate)) {
    issues.push({
      code: 'fee_item.start_date.invalid',
      field: 'startDate',
      message: validationMessages.feeItem.invalidDate,
      severity: 'error',
    });
  }

  if (!isBlank(values.endDate) && !isValidDateOnly(values.endDate)) {
    issues.push({
      code: 'fee_item.end_date.invalid',
      field: 'endDate',
      message: validationMessages.feeItem.invalidDate,
      severity: 'error',
    });
  }

  if (
    isValidDateOnly(values.startDate) &&
    isValidDateOnly(values.endDate) &&
    values.endDate < values.startDate
  ) {
    issues.push({
      code: 'fee_item.end_date.before_start',
      field: 'endDate',
      message: validationMessages.feeItem.endDateMustBeOnOrAfterStartDate,
      severity: 'error',
    });
  }

  if (!feeItemTaxModes.includes(values.taxMode)) {
    issues.push({
      code: 'fee_item.tax_mode.invalid',
      field: 'taxMode',
      message: validationMessages.feeItem.customTaxRatesRequired,
      severity: 'error',
    });
  } else if (values.taxMode === 'custom') {
    const hasMissingCustomRate = gstRate === null || pstRate === null;
    const hasNegativeRate =
      (gstRate ?? 0) < feeItemTaxRateLimits.min ||
      (pstRate ?? 0) < feeItemTaxRateLimits.min;

    if (hasMissingCustomRate) {
      issues.push({
        code: 'fee_item.tax.custom_rates_required',
        field: 'taxMode',
        message: validationMessages.feeItem.customTaxRatesRequired,
        severity: 'error',
      });
    }

    if (!hasMissingCustomRate && hasNegativeRate) {
      issues.push({
        code: 'fee_item.tax.custom_rate_invalid',
        field: 'taxMode',
        message: validationMessages.feeItem.invalidTaxRate,
        severity: 'error',
      });
    }
  }

  return createValidationResult(issues);
}
