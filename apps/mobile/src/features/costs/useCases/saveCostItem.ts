import { createFeeItem, updateFeeItem } from '../../../data/repositories';
import type { FeeItem, FeeItemCadence, FeeItemCategory } from '../../../domain/models';
import type { FeeItemFormValues } from '../../../domain/forms';
import {
  getValidationErrors,
  parseNumericInput,
  validateFeeItemForm,
} from '../../../utils/validation';
import type { ValidationIssue } from '../../../utils/validation';

export class FeeItemFormValidationError extends Error {
  issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super('Fee item form validation failed.');
    this.issues = issues;
  }
}

type SaveCostItemOptions = {
  existingFeeItem?: Pick<FeeItem, 'id' | 'sortOrder'> | null;
  gymId: string;
};

function getCustomTaxRates(values: FeeItemFormValues) {
  if (values.taxMode !== 'custom') {
    return {
      gstRate: null,
      pstRate: null,
    };
  }

  const gstRate = parseNumericInput(values.gstRate);
  const pstRate = parseNumericInput(values.pstRate);

  if (gstRate === null || pstRate === null) {
    throw new Error('Custom tax rates could not be parsed after validation.');
  }

  return {
    gstRate,
    pstRate,
  };
}

export async function saveCostItem(
  values: FeeItemFormValues,
  { existingFeeItem, gymId }: SaveCostItemOptions,
) {
  const validationResult = validateFeeItemForm(values);
  const errors = getValidationErrors(validationResult);

  if (errors.length > 0) {
    throw new FeeItemFormValidationError(errors);
  }

  const amountPreTax = parseNumericInput(values.amountPreTax);

  if (amountPreTax === null) {
    throw new Error('Cost amount could not be parsed after validation.');
  }

  const { gstRate, pstRate } = getCustomTaxRates(values);

  const input = {
    amountPreTax,
    billingAnchorDate: values.billingAnchorDate.trim() || null,
    cadence: values.cadence as FeeItemCadence,
    category: values.category as FeeItemCategory,
    endDate: values.endDate.trim() || null,
    gstRate,
    gymId,
    isActive: values.isActive,
    label: values.label.trim(),
    pstRate,
    sortOrder: existingFeeItem?.sortOrder,
    startDate: values.startDate.trim(),
    taxMode: values.taxMode,
  };

  if (existingFeeItem?.id) {
    return updateFeeItem(existingFeeItem.id, input);
  }

  return createFeeItem(input);
}
