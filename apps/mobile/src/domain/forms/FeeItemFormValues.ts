import type {
  FeeItemCadenceForV01,
  FeeItemCategory,
  FeeItemTaxMode,
} from '../models';

export interface FeeItemFormValues {
  amountPreTax: string;
  cadence: FeeItemCadenceForV01 | '';
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
