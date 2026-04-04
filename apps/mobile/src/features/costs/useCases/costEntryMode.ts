import { defaultAppSettingsValues } from '../../../domain/constants';
import type {
  FeeItemAmountInputMode,
  FeeItemFormValues,
} from '../../../domain/forms';
import type { AppSettings, FeeItemTaxMode } from '../../../domain/models';
import { parseNumericInput } from '../../../utils/validation';

export interface ResolvedCostEntryValues {
  amountInputMode: FeeItemAmountInputMode;
  amountPreTax: number;
  gstRate: number | null;
  pstRate: number | null;
  totalAmount: number;
  totalTaxAmount: number;
  taxMode: FeeItemTaxMode;
}

function roundCurrencyAmount(value: number) {
  return Number(value.toFixed(2));
}

function getEffectiveDefaultTaxRates(
  appSettings?: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'> | null,
) {
  return {
    defaultGstRate:
      appSettings?.defaultGstRate ?? defaultAppSettingsValues.defaultGstRate,
    defaultPstRate:
      appSettings?.defaultPstRate ?? defaultAppSettingsValues.defaultPstRate,
  };
}

export function deriveAmountInputModeFromTaxMode(
  taxMode: FeeItemTaxMode,
): FeeItemAmountInputMode {
  if (taxMode === 'custom') {
    return 'custom';
  }

  if (taxMode === 'none') {
    return 'tax_exempt';
  }

  return 'pre_tax';
}

export function resolveCostEntryValues(
  values: Pick<
    FeeItemFormValues,
    'amountInputMode' | 'amountPreTax' | 'gstRate' | 'pstRate'
  >,
  appSettings?: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'> | null,
): ResolvedCostEntryValues | null {
  const rawAmount = parseNumericInput(values.amountPreTax);

  if (rawAmount === null) {
    return null;
  }

  const defaults = getEffectiveDefaultTaxRates(appSettings);

  if (values.amountInputMode === 'tax_exempt') {
    return {
      amountInputMode: values.amountInputMode,
      amountPreTax: rawAmount,
      gstRate: null,
      pstRate: null,
      taxMode: 'none',
      totalAmount: rawAmount,
      totalTaxAmount: 0,
    };
  }

  if (values.amountInputMode === 'custom') {
    const gstRate = parseNumericInput(values.gstRate);
    const pstRate = parseNumericInput(values.pstRate);

    if (gstRate === null || pstRate === null) {
      return null;
    }

    const totalTaxAmount = roundCurrencyAmount(rawAmount * (gstRate + pstRate));

    return {
      amountInputMode: values.amountInputMode,
      amountPreTax: rawAmount,
      gstRate,
      pstRate,
      taxMode: 'custom',
      totalAmount: roundCurrencyAmount(rawAmount + totalTaxAmount),
      totalTaxAmount,
    };
  }

  const combinedRate = defaults.defaultGstRate + defaults.defaultPstRate;

  if (values.amountInputMode === 'post_tax') {
    const amountPreTax =
      combinedRate === 0
        ? rawAmount
        : roundCurrencyAmount(rawAmount / (1 + combinedRate));
    const totalTaxAmount = roundCurrencyAmount(rawAmount - amountPreTax);

    return {
      amountInputMode: values.amountInputMode,
      amountPreTax,
      gstRate: null,
      pstRate: null,
      taxMode: 'inherit_default',
      totalAmount: rawAmount,
      totalTaxAmount,
    };
  }

  const totalTaxAmount = roundCurrencyAmount(rawAmount * combinedRate);

  return {
    amountInputMode: values.amountInputMode,
    amountPreTax: rawAmount,
    gstRate: null,
    pstRate: null,
    taxMode: 'inherit_default',
    totalAmount: roundCurrencyAmount(rawAmount + totalTaxAmount),
    totalTaxAmount,
  };
}
