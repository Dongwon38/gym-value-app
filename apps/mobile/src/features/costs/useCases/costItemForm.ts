import { emptyFeeItemFormValues, type FeeItemFormValues } from '../../../domain/forms';
import type { FeeItem } from '../../../domain/models';

function getLocalTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function createNewCostItemFormValues(): FeeItemFormValues {
  return {
    ...emptyFeeItemFormValues,
    startDate: getLocalTodayDate(),
  };
}

export function mapFeeItemToFormValues(feeItem: FeeItem): FeeItemFormValues {
  return {
    amountPreTax: String(feeItem.amountPreTax),
    billingAnchorDate: feeItem.billingAnchorDate ?? '',
    cadence: feeItem.cadence === 'custom' ? '' : feeItem.cadence,
    category: feeItem.category,
    endDate: feeItem.endDate ?? '',
    gstRate: feeItem.gstRate === null ? '' : String(feeItem.gstRate),
    isActive: feeItem.isActive,
    label: feeItem.label,
    pstRate: feeItem.pstRate === null ? '' : String(feeItem.pstRate),
    startDate: feeItem.startDate,
    taxMode: feeItem.taxMode,
  };
}
