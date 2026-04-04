import type {
  FeeItemCadence,
  FeeItemCategory,
  FeeItemTaxMode,
} from '../models';

export const feeItemAmountInputModes = [
  'pre_tax',
  'post_tax',
  'tax_exempt',
  'custom',
] as const;
export type FeeItemAmountInputMode = (typeof feeItemAmountInputModes)[number];

export interface FeeItemFormValues {
  amountPreTax: string;
  amountInputMode: FeeItemAmountInputMode;
  billingAnchorDate: string;
  cadence: FeeItemCadence | '';
  category: FeeItemCategory | '';
  endDate: string;
  gstRate: string;
  isActive: boolean;
  label: string;
  pstRate: string;
  startDate: string;
  taxMode: FeeItemTaxMode;
}

export const emptyFeeItemFormValues: FeeItemFormValues = {
  amountPreTax: '',
  amountInputMode: 'pre_tax',
  billingAnchorDate: '',
  cadence: 'monthly',
  category: 'monthly_membership',
  endDate: '',
  gstRate: '',
  isActive: true,
  label: '',
  pstRate: '',
  startDate: '',
  taxMode: 'inherit_default',
};
