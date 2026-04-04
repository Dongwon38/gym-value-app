import type {
  FeeItem,
  FeeItemCadence,
  FeeItemCategory,
} from '../../../domain/models';
import { listFeeItems } from '../../../data/repositories';

const categoryLabels: Record<FeeItemCategory, string> = {
  monthly_membership: 'Monthly membership',
  annual_fee: 'Annual fee',
  signup_fee: 'Signup fee',
  locker_fee: 'Locker fee',
  pt: 'Personal training',
  other: 'Other',
};

const cadenceLabels: Record<FeeItemCadence, string> = {
  one_time: 'One-time',
  bi_weekly: 'Bi-weekly',
  monthly: 'Monthly',
  annual: 'Annual',
  custom: 'Custom cadence',
};

const costAmountFormatter = new Intl.NumberFormat('en-CA', {
  currency: 'CAD',
  style: 'currency',
});

export async function getCostItems() {
  return listFeeItems();
}

export function formatCostItemAmount(amountPreTax: number) {
  return costAmountFormatter.format(amountPreTax);
}

export function formatCostItemCadence(cadence: FeeItemCadence) {
  return cadenceLabels[cadence];
}

export function formatCostItemCategory(category: FeeItemCategory) {
  return categoryLabels[category];
}

export function formatCostItemDateRange({
  endDate,
  startDate,
}: Pick<FeeItem, 'endDate' | 'startDate'>) {
  if (endDate) {
    return `${startDate} to ${endDate}`;
  }

  return `Starts ${startDate}`;
}
