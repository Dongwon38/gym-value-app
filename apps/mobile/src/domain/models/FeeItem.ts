export const feeItemCategories = [
  'monthly_membership',
  'annual_fee',
  'signup_fee',
  'locker_fee',
  'pt',
  'other',
] as const;
export type FeeItemCategory = (typeof feeItemCategories)[number];

export const feeItemCadences = [
  'one_time',
  'bi_weekly',
  'monthly',
  'annual',
  'custom',
] as const;
export type FeeItemCadence = (typeof feeItemCadences)[number];

export const feeItemCadencesForV01 = ['one_time', 'monthly', 'annual'] as const;
export type FeeItemCadenceForV01 = (typeof feeItemCadencesForV01)[number];

export const feeItemTaxModes = [
  'inherit_default',
  'none',
  'custom',
] as const;
export type FeeItemTaxMode = (typeof feeItemTaxModes)[number];

export interface FeeItem {
  id: string;
  gymId: string;
  category: FeeItemCategory;
  label: string;
  amountPreTax: number;
  cadence: FeeItemCadence;
  billingAnchorDate: string | null;
  startDate: string;
  endDate: string | null;
  taxMode: FeeItemTaxMode;
  gstRate: number | null;
  pstRate: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
