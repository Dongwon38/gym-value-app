import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Visit } from '../../domain/models';
import { VisitEditorCard } from '../../features/visits/components/VisitEditorCard';
import { useVisitForm } from '../../features/visits/hooks/useVisitForm';
import { useVisits } from '../../features/visits/hooks/useVisits';
import { cancelVisit } from '../../features/visits/useCases/cancelVisit';
import {
  formatVisitDuration,
  formatVisitStatus,
  formatVisitWindow,
} from '../../features/visits/useCases/visits';
import { shouldReviewActiveVisit } from '../../features/visits/useCases/sessionReview';
import { Card, EmptyState, PrimaryButton, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

type CancelState = 'idle' | 'saving' | 'success' | 'error';

export function VisitsScreen() {
  const theme = useAppTheme();
  const { activeCount, loadError, loadState, reload, visits } = useVisits();
  const {
    activeVisit,
    closeEditor,
    derivedDurationMinutes,
    editingVisit,
    editorMode,
    errors,
    formValues,
    hasPrimaryGym,
    markVisitCancelled,
    primaryGym,
    save,
    saveFeedback,
    saveState,
    setFieldValue,
    startCreate,
    startEdit,
  } = useVisitForm();
  const [cancelState, setCancelState] = useState<CancelState>('idle');
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);
  const [cancellingVisitId, setCancellingVisitId] = useState<string | null>(null);
  const totalCount = visits.length;
  const needsActiveVisitReview =
    activeVisit !== null ? shouldReviewActiveVisit(activeVisit) : false;

  async function handleCancelVisit(visit: Visit) {
    setCancelState('saving');
    setCancelFeedback(null);
    setCancellingVisitId(visit.id);

    try {
      await cancelVisit(visit);
      markVisitCancelled(visit.id);

      if (editingVisit?.id === visit.id) {
        closeEditor();
      }

      await reload();
      setCancelState('success');
      setCancelFeedback('Visit cancelled. Cancelled rows no longer appear in the default list.');
    } catch (error) {
      setCancelState('error');
      setCancelFeedback(
        error instanceof Error ? error.message : 'Unknown visit cancel error.',
      );
    } finally {
      setCancellingVisitId(null);
    }
  }

  return (
    <ScreenContainer
      description="Manual visits and active session."
      eyebrow="Visits"
      scroll
      title="Visits">
      <Card
        subtitle="Read path, add/edit form wiring, duplicate active guard, and cancelled row filtering are live on the same surface."
        title="Visit feed overview">
        <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
          {totalCount === 0
            ? 'No saved visits yet. Open the editor below to create the first completed or active visit for your primary gym.'
            : `${totalCount} visit${totalCount === 1 ? '' : 's'} loaded. ${activeCount} active and ${totalCount - activeCount} completed.`}
        </Text>
        {cancelFeedback ? (
          <Text
            style={[
              styles.feedback,
              {
                color:
                  cancelState === 'error'
                    ? theme.colors.danger
                    : cancelState === 'success'
                      ? theme.colors.accent
                      : theme.colors.textSecondary,
              },
            ]}>
            {cancelFeedback}
          </Text>
        ) : null}
        <View style={[styles.actions, { marginTop: theme.spacing.lg }]}>
          <PrimaryButton
            label="Add Visit"
            onPress={() => {
              setCancelState('idle');
              setCancelFeedback(null);
              startCreate();
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              reload();
            }}
            style={({ pressed }) => [
              styles.inlineAction,
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <Text style={[styles.inlineActionLabel, { color: theme.colors.accent }]}>
              Refresh List
            </Text>
          </Pressable>
        </View>
      </Card>

      {activeVisit ? (
        <Card
          subtitle={formatVisitWindow(activeVisit)}
          title="Current active visit">
          <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
            {formatVisitDuration(activeVisit.durationMinutes)}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            Active visits are restored from SQLite on app launch. If suggestions fail, you can still finish or cancel the session manually from this screen.
          </Text>
          {needsActiveVisitReview ? (
            <Text style={[styles.feedback, { color: theme.colors.warning }]}>
              This active visit has been open for a long time. Review it now to avoid skewed duration and KPI calculations.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {editorMode !== 'closed' ? (
        <VisitEditorCard
          derivedDurationMinutes={derivedDurationMinutes}
          editorMode={editorMode}
          formValues={formValues}
          hasPrimaryGym={hasPrimaryGym}
          onClose={closeEditor}
          onSave={async () => {
            const savedVisit = await save();

            if (savedVisit) {
              setCancelState('idle');
              setCancelFeedback(null);
              await reload();
            }
          }}
          onSetFieldValue={setFieldValue}
          primaryGymName={primaryGym?.name}
          saveFeedback={saveFeedback}
          saveState={saveState}
          validationErrors={errors}
        />
      ) : null}

      {loadState === 'loading' ? (
        <Card
          subtitle="The visit list query is reading saved visit rows from the local SQLite store."
          title="Loading saved visits">
          <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
            Once the query resolves, this screen switches between the empty state
            and newest-first visit rows automatically.
          </Text>
        </Card>
      ) : null}

      {loadState === 'error' ? (
        <Card
          subtitle="Retry the read path after checking the local DB bootstrap state."
          title="Visit list needs attention">
          <Text style={[styles.note, { color: theme.colors.danger }]}>
            {loadError ?? 'Unknown visit list query error.'}
          </Text>
          <PrimaryButton
            label="Retry Visit Load"
            onPress={() => {
              reload();
            }}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      ) : null}

      {loadState === 'ready' && visits.length === 0 ? (
        <EmptyState
          actionLabel="Add Visit"
          body="No saved visits exist yet. This screen now saves completed and active manual visits, enforces a single active visit, and hides cancelled rows from the default feed."
          onActionPress={() => {
            startCreate();
          }}
          title="No visits saved yet"
        />
      ) : null}

      {loadState === 'ready' && visits.length > 0
        ? visits.map(visit => (
            <Card
              key={visit.id}
              subtitle={formatVisitWindow(visit)}
              title={visit.notes?.trim() || 'Manual visit'}>
              <View style={styles.rowHeader}>
                <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
                  {formatVisitDuration(visit.durationMinutes)}
                </Text>
                <Text
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        visit.status === 'active'
                          ? theme.colors.surfaceMuted
                          : theme.colors.border,
                      color:
                        visit.status === 'active'
                          ? theme.colors.accent
                          : theme.colors.textMuted,
                    },
                  ]}>
                  {formatVisitStatus(visit.status)}
                </Text>
              </View>
              <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                Source: {visit.source}
              </Text>
              <View style={[styles.actions, { marginTop: theme.spacing.lg }]}>
                <PrimaryButton
                  label="Edit Visit"
                  onPress={() => {
                    setCancelState('idle');
                    setCancelFeedback(null);
                    startEdit(visit);
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={cancellingVisitId === visit.id}
                  onPress={() => {
                    handleCancelVisit(visit);
                  }}
                  style={({ pressed }) => [
                    styles.inlineAction,
                    {
                      opacity:
                        cancellingVisitId === visit.id
                          ? 0.5
                          : pressed
                            ? 0.7
                            : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.inlineActionLabel,
                      {
                        color:
                          cancellingVisitId === visit.id
                            ? theme.colors.textMuted
                            : theme.colors.danger,
                      },
                    ]}>
                    {cancellingVisitId === visit.id ? 'Cancelling...' : 'Delete Visit'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          ))
        : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  feedback: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 12,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  inlineActionLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  meta: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  note: {
    lineHeight: 22,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statusBadge: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
});
