import { calculateFeeItemTotal } from '../../../domain/calculations/fees';
import { defaultAppSettingsValues } from '../../../domain/constants';
import {
  emptyFeeItemFormValues,
  type FeeItemFormValues,
} from '../../../domain/forms';
import type {
  AppSettings,
  FeeItem,
  FeeItemCadence,
  FeeItemCategory,
} from '../../../domain/models';
import { parseNumericInput } from '../../../utils/validation';
import {
  createNewCostItemFormValues,
  mapFeeItemToFormValues,
} from './costItemForm';

export const starterCostPresetKeys = [
  'membership',
  'signup',
  'annual',
  'locker',
] as const;

export type StarterCostPresetKey = (typeof starterCostPresetKeys)[number];

export interface StarterCostPreset {
  category: FeeItemCategory;
  defaultCadence: Exclude<FeeItemCadence, 'custom'>;
  defaultLabel: string;
  description: string;
  key: StarterCostPresetKey;
  title: string;
}

export interface CostSetupLineDraft {
  draftId: string;
  enabled: boolean;
  existingFeeItemId: string | null;
  existingSortOrder: number | null;
  formValues: FeeItemFormValues;
  kind: 'starter' | 'custom';
  presetKey: StarterCostPresetKey | null;
  showAdvanced: boolean;
}

export interface CostSetupDraftState {
  customLines: CostSetupLineDraft[];
  starterLines: CostSetupLineDraft[];
}

export interface CostSetupLinePreview {
  currency: string;
  locale: string;
  preTaxAmount: number;
  totalAmount: number;
  totalTaxAmount: number;
}

const starterCostPresets: StarterCostPreset[] = [
  {
    category: 'monthly_membership',
    defaultCadence: 'bi_weekly',
    defaultLabel: 'Membership fee',
    description: 'Default cadence is bi-weekly. Leave it blank or skip it if you do not pay this cost.',
    key: 'membership',
    title: 'Membership',
  },
  {
    category: 'signup_fee',
    defaultCadence: 'one_time',
    defaultLabel: 'Signup fee',
    description: 'Use this for one-time joining or enrollment charges.',
    key: 'signup',
    title: 'Signup fee',
  },
  {
    category: 'annual_fee',
    defaultCadence: 'annual',
    defaultLabel: 'Annual fee',
    description: 'Annual charges can optionally use a billing date anchor.',
    key: 'annual',
    title: 'Annual fee',
  },
  {
    category: 'locker_fee',
    defaultCadence: 'monthly',
    defaultLabel: 'Locker fee',
    description: 'Use this for recurring locker or equipment rental costs.',
    key: 'locker',
    title: 'Locker fee',
  },
];

function buildLineDraftId(prefix: string, suffix: string) {
  return `${prefix}_${suffix}`;
}

function createStarterFormValues(preset: StarterCostPreset): FeeItemFormValues {
  return {
    ...createNewCostItemFormValues(),
    category: preset.category,
    cadence: preset.defaultCadence,
    label: preset.defaultLabel,
  };
}

function createStarterLineDraft(
  preset: StarterCostPreset,
  existingFeeItem?: FeeItem,
): CostSetupLineDraft {
  return {
    draftId: buildLineDraftId(
      'starter',
      existingFeeItem?.id ?? preset.key,
    ),
    enabled: existingFeeItem?.isActive ?? false,
    existingFeeItemId: existingFeeItem?.id ?? null,
    existingSortOrder: existingFeeItem?.sortOrder ?? null,
    formValues: existingFeeItem
      ? mapFeeItemToFormValues(existingFeeItem)
      : createStarterFormValues(preset),
    kind: 'starter',
    presetKey: preset.key,
    showAdvanced: Boolean(existingFeeItem?.endDate || existingFeeItem?.billingAnchorDate),
  };
}

export function createCustomCostSetupLine(
  overrides: Partial<CostSetupLineDraft> = {},
): CostSetupLineDraft {
  const nowToken = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    draftId: buildLineDraftId('custom', nowToken),
    enabled: true,
    existingFeeItemId: null,
    existingSortOrder: null,
    formValues: {
      ...createNewCostItemFormValues(),
      ...emptyFeeItemFormValues,
      category: 'other',
      cadence: 'monthly',
      label: '',
      startDate: createNewCostItemFormValues().startDate,
      taxMode: 'inherit_default',
    },
    kind: 'custom',
    presetKey: null,
    showAdvanced: false,
    ...overrides,
  };
}

function createCustomLineDraft(existingFeeItem: FeeItem): CostSetupLineDraft {
  return {
    draftId: buildLineDraftId('custom', existingFeeItem.id),
    enabled: existingFeeItem.isActive,
    existingFeeItemId: existingFeeItem.id,
    existingSortOrder: existingFeeItem.sortOrder,
    formValues: mapFeeItemToFormValues(existingFeeItem),
    kind: 'custom',
    presetKey: null,
    showAdvanced: true,
  };
}

export function getStarterCostPresets() {
  return starterCostPresets;
}

export function getStarterCostPreset(
  presetKey: StarterCostPresetKey,
): StarterCostPreset {
  const preset = starterCostPresets.find(item => item.key === presetKey);

  if (!preset) {
    throw new Error(`Unknown starter cost preset "${presetKey}".`);
  }

  return preset;
}

export function buildCostSetupDraftState(
  costItems: FeeItem[],
): CostSetupDraftState {
  const activeCostItems = costItems
    .filter(costItem => costItem.isActive)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const remainingCostItems = [...activeCostItems];

  const starterLines = starterCostPresets.map(preset => {
    const presetMatchIndex = remainingCostItems.findIndex(
      costItem => costItem.category === preset.category,
    );
    const matchedFeeItem =
      presetMatchIndex >= 0
        ? remainingCostItems.splice(presetMatchIndex, 1)[0]
        : undefined;

    return createStarterLineDraft(preset, matchedFeeItem);
  });

  return {
    customLines: remainingCostItems.map(createCustomLineDraft),
    starterLines,
  };
}

export function getNormalizedCostSetupLineLabel(line: CostSetupLineDraft) {
  if (line.formValues.label.trim()) {
    return line.formValues.label.trim();
  }

  if (line.presetKey) {
    return getStarterCostPreset(line.presetKey).defaultLabel;
  }

  return '';
}

export function shouldPersistCostSetupLine(line: CostSetupLineDraft) {
  const amountPreTax = parseNumericInput(line.formValues.amountPreTax);

  return line.enabled && amountPreTax !== null;
}

export function shouldShowBillingAnchorDate(
  cadence: FeeItemFormValues['cadence'],
) {
  return cadence === 'annual' || cadence === 'bi_weekly';
}

export function getCostSetupLinePreview(
  line: Pick<CostSetupLineDraft, 'formValues'>,
  appSettings?: Pick<AppSettings, 'currency' | 'defaultGstRate' | 'defaultPstRate' | 'locale'> | null,
): CostSetupLinePreview | null {
  const amountPreTax = parseNumericInput(line.formValues.amountPreTax);

  if (amountPreTax === null) {
    return null;
  }

  const resolvedSettings = {
    currency: appSettings?.currency ?? defaultAppSettingsValues.currency,
    defaultGstRate:
      appSettings?.defaultGstRate ?? defaultAppSettingsValues.defaultGstRate,
    defaultPstRate:
      appSettings?.defaultPstRate ?? defaultAppSettingsValues.defaultPstRate,
    locale: appSettings?.locale ?? defaultAppSettingsValues.locale,
  };

  const total = calculateFeeItemTotal(
    {
      amountPreTax,
      gstRate:
        line.formValues.taxMode === 'custom'
          ? parseNumericInput(line.formValues.gstRate)
          : null,
      pstRate:
        line.formValues.taxMode === 'custom'
          ? parseNumericInput(line.formValues.pstRate)
          : null,
      taxMode: line.formValues.taxMode,
    },
    resolvedSettings,
  );

  return {
    currency: resolvedSettings.currency,
    locale: resolvedSettings.locale,
    preTaxAmount: total.preTaxAmount,
    totalAmount: total.totalAmount,
    totalTaxAmount: total.totalTaxAmount,
  };
}

export function formatCostSetupMoney(
  amount: number,
  settings?: Pick<AppSettings, 'currency' | 'locale'> | null,
) {
  const locale = settings?.locale ?? defaultAppSettingsValues.locale;
  const currency = settings?.currency ?? defaultAppSettingsValues.currency;

  return new Intl.NumberFormat(locale, {
    currency,
    style: 'currency',
  }).format(amount);
}
