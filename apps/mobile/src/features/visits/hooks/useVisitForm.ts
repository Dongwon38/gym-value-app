import { useEffect, useMemo, useState } from 'react';

import type { VisitFormValues } from '../../../domain/forms';
import type { Gym, Visit } from '../../../domain/models';
import { getValidationErrors, validateVisitForm } from '../../../utils/validation';
import { getPrimaryGym } from '../../gym/useCases/primaryGym';
import {
  createNewVisitFormValues,
  mapVisitToFormValues,
} from '../useCases/visitForm';
import {
  deriveCompletedVisitDurationMinutes,
  saveVisit,
  VisitFormValidationError,
} from '../useCases/saveVisit';

type VisitEditorMode = 'closed' | 'create' | 'edit';
type VisitSaveState = 'idle' | 'saving' | 'success' | 'error';

export function useVisitForm() {
  const [primaryGym, setPrimaryGym] = useState<Gym | null>(null);
  const [editorMode, setEditorMode] = useState<VisitEditorMode>('closed');
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [formValues, setFormValues] = useState<VisitFormValues>(() =>
    createNewVisitFormValues(''),
  );
  const [hasReviewed, setHasReviewed] = useState(false);
  const [saveState, setSaveState] = useState<VisitSaveState>('idle');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPrimaryGymForVisits() {
      try {
        const gym = await getPrimaryGym();

        if (!isMounted) {
          return;
        }

        setPrimaryGym(gym);
        if (!editingVisit) {
          setFormValues(createNewVisitFormValues(gym?.id ?? ''));
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setPrimaryGym(null);
      }
    }

    loadPrimaryGymForVisits();

    return () => {
      isMounted = false;
    };
  }, [editingVisit]);

  const effectiveGymId = editingVisit?.gymId ?? primaryGym?.id ?? '';
  const validationResult = useMemo(
    () =>
      validateVisitForm({
        ...formValues,
        gymId: effectiveGymId,
        status: 'completed',
      }),
    [effectiveGymId, formValues],
  );
  const errors = hasReviewed ? getValidationErrors(validationResult) : [];
  const derivedDurationMinutes = deriveCompletedVisitDurationMinutes(formValues);

  return {
    derivedDurationMinutes,
    editingVisit,
    editorMode,
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

      if (!effectiveGymId) {
        setSaveState('error');
        setSaveFeedback('Set up your primary gym in Settings before adding visits.');
        return null;
      }

      try {
        setSaveState('saving');
        const savedVisit = await saveVisit(formValues, {
          existingVisit: editingVisit,
          gymId: effectiveGymId,
        });

        setEditingVisit(savedVisit);
        setFormValues(mapVisitToFormValues(savedVisit));
        setEditorMode('edit');
        setSaveState('success');
        setSaveFeedback(editingVisit ? 'Visit updated.' : 'Visit created.');

        return savedVisit;
      } catch (error) {
        if (error instanceof VisitFormValidationError) {
          setSaveState('error');
          setSaveFeedback('Review the highlighted fields before saving.');
          return null;
        }

        setSaveState('error');
        setSaveFeedback(
          error instanceof Error ? error.message : 'Unknown visit save error.',
        );
        return null;
      }
    },
    saveFeedback,
    saveState,
    setFieldValue: <Field extends keyof VisitFormValues>(
      field: Field,
      value: VisitFormValues[Field],
    ) => {
      setFormValues(currentValues => ({
        ...currentValues,
        [field]: value,
      }));
    },
    startCreate: () => {
      setEditorMode('create');
      setEditingVisit(null);
      setFormValues(createNewVisitFormValues(primaryGym?.id ?? ''));
      setHasReviewed(false);
      setSaveState('idle');
      setSaveFeedback(null);
    },
    startEdit: (visit: Visit) => {
      setEditorMode('edit');
      setEditingVisit(visit);
      setFormValues(mapVisitToFormValues(visit));
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
