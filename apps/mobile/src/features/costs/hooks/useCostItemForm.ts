import { useEffect, useMemo, useState } from 'react';

import type { FeeItem, Gym } from '../../../domain/models';
import type { FeeItemFormValues } from '../../../domain/forms';
import { getValidationErrors, validateFeeItemForm } from '../../../utils/validation';
import { getPrimaryGym } from '../../gym/useCases/primaryGym';
import {
  createNewCostItemFormValues,
  mapFeeItemToFormValues,
} from '../useCases/costItemForm';
import {
  FeeItemFormValidationError,
  saveCostItem,
} from '../useCases/saveCostItem';

type CostItemEditorMode = 'closed' | 'create' | 'edit';
type CostItemSaveState = 'idle' | 'saving' | 'success' | 'error';

export function useCostItemForm() {
  const [primaryGym, setPrimaryGym] = useState<Gym | null>(null);
  const [editorMode, setEditorMode] = useState<CostItemEditorMode>('closed');
  const [editingCostItem, setEditingCostItem] = useState<FeeItem | null>(null);
  const [formValues, setFormValues] = useState<FeeItemFormValues>(() =>
    createNewCostItemFormValues(),
  );
  const [hasReviewed, setHasReviewed] = useState(false);
  const [saveState, setSaveState] = useState<CostItemSaveState>('idle');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPrimaryGymForCosts() {
      try {
        const gym = await getPrimaryGym();

        if (!isMounted) {
          return;
        }

        setPrimaryGym(gym);
      } catch {
        if (!isMounted) {
          return;
        }

        setPrimaryGym(null);
      }
    }

    loadPrimaryGymForCosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const validationResult = useMemo(
    () => validateFeeItemForm(formValues),
    [formValues],
  );
  const errors = hasReviewed ? getValidationErrors(validationResult) : [];

  return {
    editorMode,
    editingCostItem,
    errors,
    formValues,
    hasPrimaryGym: primaryGym !== null,
    primaryGym,
    save: async () => {
      setHasReviewed(true);
      setSaveState('idle');
      setSaveFeedback(null);

      if (errors.length > 0) {
        setSaveState('error');
        setSaveFeedback('Review the highlighted fields before saving.');
        return null;
      }

      const gymId = editingCostItem?.gymId ?? primaryGym?.id;

      if (!gymId) {
        setSaveState('error');
        setSaveFeedback(
          'Set up your primary gym in Settings before adding cost items.',
        );
        return null;
      }

      try {
        setSaveState('saving');

        const savedCostItem = await saveCostItem(formValues, {
          existingFeeItem: editingCostItem,
          gymId,
        });

        setEditingCostItem(savedCostItem);
        setFormValues(mapFeeItemToFormValues(savedCostItem));
        setEditorMode('edit');
        setSaveState('success');
        setSaveFeedback(
          editingCostItem ? 'Cost item updated.' : 'Cost item created.',
        );

        return savedCostItem;
      } catch (error) {
        if (error instanceof FeeItemFormValidationError) {
          setSaveState('error');
          setSaveFeedback('Review the highlighted fields before saving.');
          return null;
        }

        setSaveState('error');
        setSaveFeedback(
          error instanceof Error ? error.message : 'Unknown cost save error.',
        );
        return null;
      }
    },
    saveFeedback,
    saveState,
    setFieldValue: <Field extends keyof FeeItemFormValues>(
      field: Field,
      value: FeeItemFormValues[Field],
    ) => {
      setFormValues(currentValues => ({
        ...currentValues,
        [field]: value,
      }));
    },
    startCreate: () => {
      setEditorMode('create');
      setEditingCostItem(null);
      setFormValues(createNewCostItemFormValues());
      setHasReviewed(false);
      setSaveState('idle');
      setSaveFeedback(null);
    },
    startEdit: (feeItem: FeeItem) => {
      setEditorMode('edit');
      setEditingCostItem(feeItem);
      setFormValues(mapFeeItemToFormValues(feeItem));
      setHasReviewed(false);
      setSaveState('idle');
      setSaveFeedback(null);
    },
    closeEditor: () => {
      setEditorMode('closed');
      setHasReviewed(false);
      setSaveState('idle');
      setSaveFeedback(null);
    },
  };
}
