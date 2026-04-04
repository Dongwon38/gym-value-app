import { defaultAppSettingsValues } from '../../../domain/constants';
import { createFeeItem, updateFeeItem } from '../../../data/repositories';
import type {
  AppSettings,
  FeeItem,
  FeeItemCadence,
  FeeItemCategory,
} from '../../../domain/models';
import type { FeeItemFormValues } from '../../../domain/forms';
import {
  getValidationErrors,
  validateFeeItemForm,
} from '../../../utils/validation';
import type { ValidationIssue } from '../../../utils/validation';
import { resolveCostEntryValues } from './costEntryMode';

export class FeeItemFormValidationError extends Error {
  issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super('Fee item form validation failed.');
    this.issues = issues;
  }
}

type SaveCostItemOptions = {
  appSettings?: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'> | null;
  existingFeeItem?: Pick<FeeItem, 'id' | 'sortOrder'> | null;
  gymId: string;
};

export async function saveCostItem(
  values: FeeItemFormValues,
  { appSettings, existingFeeItem, gymId }: SaveCostItemOptions,
) {
  const validationResult = validateFeeItemForm(values);
  const errors = getValidationErrors(validationResult);

  if (errors.length > 0) {
    throw new FeeItemFormValidationError(errors);
  }

  const resolvedCostEntryValues = resolveCostEntryValues(values, appSettings ?? {
    defaultGstRate: defaultAppSettingsValues.defaultGstRate,
    defaultPstRate: defaultAppSettingsValues.defaultPstRate,
  });

  if (!resolvedCostEntryValues) {
    throw new Error('Cost amount could not be parsed after validation.');
  }

  const input = {
    amountPreTax: resolvedCostEntryValues.amountPreTax,
    billingAnchorDate: values.billingAnchorDate.trim() || null,
    cadence: values.cadence as FeeItemCadence,
    category: values.category as FeeItemCategory,
    endDate: values.endDate.trim() || null,
    gstRate: resolvedCostEntryValues.gstRate,
    gymId,
    isActive: values.isActive,
    label: values.label.trim(),
    pstRate: resolvedCostEntryValues.pstRate,
    sortOrder: existingFeeItem?.sortOrder,
    startDate: values.startDate.trim(),
    taxMode: resolvedCostEntryValues.taxMode,
  };

  if (existingFeeItem?.id) {
    return updateFeeItem(existingFeeItem.id, input);
  }

  return createFeeItem(input);
}
