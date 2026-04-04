import type { AppSettings } from '../../../domain/models';
import { setFeeItemActiveState } from '../../../data/repositories';
import type { FeeItemFormValues } from '../../../domain/forms';
import type { ValidationIssue } from '../../../utils/validation';
import { getValidationErrors, validateFeeItemForm } from '../../../utils/validation';
import { saveCostItem } from './saveCostItem';
import {
  getNormalizedCostSetupLineLabel,
  shouldPersistCostSetupLine,
  type CostSetupLineDraft,
} from './costSetup';

export class CostSetupFormValidationError extends Error {
  issuesByLine: Record<string, ValidationIssue[]>;

  constructor(issuesByLine: Record<string, ValidationIssue[]>) {
    super('Cost setup validation failed.');
    this.issuesByLine = issuesByLine;
  }
}

type SaveCostSetupOptions = {
  appSettings?: Pick<AppSettings, 'defaultGstRate' | 'defaultPstRate'> | null;
  gymId: string;
};

type SaveCostSetupSummary = {
  createdCount: number;
  deactivatedCount: number;
  skippedCount: number;
  updatedCount: number;
};

type CostSetupAction =
  | {
      kind: 'deactivate';
      line: CostSetupLineDraft;
    }
  | {
      kind: 'save';
      line: CostSetupLineDraft;
      values: FeeItemFormValues;
    }
  | {
      kind: 'skip';
      line: CostSetupLineDraft;
    };

function normalizeCostSetupLineValues(
  line: CostSetupLineDraft,
): FeeItemFormValues {
  return {
    ...line.formValues,
    billingAnchorDate: line.formValues.billingAnchorDate.trim(),
    endDate: line.formValues.endDate.trim(),
    label: getNormalizedCostSetupLineLabel(line),
    startDate: line.formValues.startDate.trim(),
  };
}

function buildCostSetupActions(lines: CostSetupLineDraft[]) {
  const issuesByLine: Record<string, ValidationIssue[]> = {};
  const actions: CostSetupAction[] = [];

  for (const line of lines) {
    if (!shouldPersistCostSetupLine(line)) {
      actions.push(
        line.existingFeeItemId
          ? { kind: 'deactivate', line }
          : { kind: 'skip', line },
      );
      continue;
    }

    const normalizedValues = normalizeCostSetupLineValues(line);
    const validationResult = validateFeeItemForm(normalizedValues);
    const errors = getValidationErrors(validationResult);

    if (errors.length > 0) {
      issuesByLine[line.draftId] = errors;
      continue;
    }

    actions.push({
      kind: 'save',
      line,
      values: normalizedValues,
    });
  }

  if (Object.keys(issuesByLine).length > 0) {
    throw new CostSetupFormValidationError(issuesByLine);
  }

  return actions;
}

export async function saveCostSetup(
  lines: CostSetupLineDraft[],
  { appSettings, gymId }: SaveCostSetupOptions,
): Promise<SaveCostSetupSummary> {
  const actions = buildCostSetupActions(lines);
  const summary: SaveCostSetupSummary = {
    createdCount: 0,
    deactivatedCount: 0,
    skippedCount: 0,
    updatedCount: 0,
  };

  for (const action of actions) {
    if (action.kind === 'skip') {
      summary.skippedCount += 1;
      continue;
    }

    if (action.kind === 'deactivate') {
      if (action.line.existingFeeItemId) {
        await setFeeItemActiveState(action.line.existingFeeItemId, false);
        summary.deactivatedCount += 1;
      }
      continue;
    }

    await saveCostItem(action.values, {
      appSettings,
      existingFeeItem: action.line.existingFeeItemId
        ? {
            id: action.line.existingFeeItemId,
            sortOrder: action.line.existingSortOrder ?? undefined,
          }
        : undefined,
      gymId,
    });

    if (action.line.existingFeeItemId) {
      summary.updatedCount += 1;
    } else {
      summary.createdCount += 1;
    }
  }

  return summary;
}
