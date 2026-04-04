import type {
  FeeItemCadence,
  FeeItemCategory,
  FeeItemTaxMode,
} from '../models';

export interface FeeItemFormValues {
  amountPreTax: string;
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
