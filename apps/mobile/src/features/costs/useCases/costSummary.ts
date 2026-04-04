import {
  calculateFeeItemTotal,
} from '../../../domain/calculations';
import type { AppSettings, FeeItem, FeeItemCadence, FeeItemCategory } from '../../../domain/models';

function resolveFormatterSettings(
  settings?: Pick<AppSettings, 'currency' | 'locale'> | null,
) {
  return {
    currency: settings?.currency ?? 'CAD',
    locale: settings?.locale ?? 'en-CA',
  };
}

export function formatCostDisplayAmount(
  feeItem: Pick<FeeItem, 'amountPreTax' | 'gstRate' | 'pstRate' | 'taxMode'>,
  appSettings?: Pick<
    AppSettings,
    'currency' | 'defaultGstRate' | 'defaultPstRate' | 'locale'
  > | null,
) {
  const formatterSettings = resolveFormatterSettings(appSettings);
  const total = calculateFeeItemTotal(
    feeItem,
    appSettings ?? {
      defaultGstRate: 0.05,
      defaultPstRate: 0.07,
    },
  );

  return new Intl.NumberFormat(formatterSettings.locale, {
    currency: formatterSettings.currency,
    style: 'currency',
  }).format(total.totalAmount);
}

function getMonthlyEquivalentMultiplier(cadence: FeeItemCadence) {
  if (cadence === 'monthly') {
    return 1;
  }

  if (cadence === 'bi_weekly') {
    return 26 / 12;
  }

  if (cadence === 'annual') {
    return 1 / 12;
  }

  return 0;
}

export function calculateRecurringMonthlySummary(
  feeItems: FeeItem[],
  appSettings?: Pick<
    AppSettings,
    'defaultGstRate' | 'defaultPstRate'
  > | null,
) {
  return feeItems.reduce((sum, feeItem) => {
    if (!feeItem.isActive) {
      return sum;
    }

    if (
      feeItem.cadence !== 'monthly' &&
      feeItem.cadence !== 'bi_weekly' &&
      feeItem.cadence !== 'annual'
    ) {
      return sum;
    }

    const total = calculateFeeItemTotal(
      feeItem,
      appSettings ?? {
        defaultGstRate: 0.05,
        defaultPstRate: 0.07,
      },
    );

    return sum + total.totalAmount * getMonthlyEquivalentMultiplier(feeItem.cadence);
  }, 0);
}

export function formatRecurringSummaryAmount(
  amount: number,
  settings?: Pick<AppSettings, 'currency' | 'locale'> | null,
) {
  const formatterSettings = resolveFormatterSettings(settings);

  return new Intl.NumberFormat(formatterSettings.locale, {
    currency: formatterSettings.currency,
    style: 'currency',
  }).format(Number(amount.toFixed(2)));
}

export function formatCostCadenceSuffix(cadence: FeeItemCadence) {
  switch (cadence) {
    case 'monthly':
      return '/mo';
    case 'bi_weekly':
      return '/2wk';
    case 'annual':
      return '/yr';
    case 'one_time':
      return 'once';
    default:
      return '';
  }
}

export function getCostCategoryBadge(category: FeeItemCategory) {
  switch (category) {
    case 'monthly_membership':
      return 'M';
    case 'annual_fee':
      return 'A';
    case 'signup_fee':
      return 'S';
    case 'locker_fee':
      return 'L';
    case 'pt':
      return 'PT';
    case 'other':
      return 'C';
    default:
      return 'C';
  }
}
