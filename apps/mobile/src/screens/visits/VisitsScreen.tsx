import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VisitEditorCard } from '../../features/visits/components/VisitEditorCard';
import { useVisitForm } from '../../features/visits/hooks/useVisitForm';
import { useVisits } from '../../features/visits/hooks/useVisits';
import {
  formatVisitDuration,
  formatVisitStatus,
  formatVisitWindow,
} from '../../features/visits/useCases/visits';
import { Card, EmptyState, PrimaryButton, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

export function VisitsScreen() {
  const theme = useAppTheme();
  const { activeCount, loadError, loadState, reload, visits } = useVisits();
  const {
    closeEditor,
    derivedDurationMinutes,
    editorMode,
    errors,
    formValues,
    hasPrimaryGym,
    primaryGym,
    save,
    saveFeedback,
    saveState,
    setFieldValue,
    startCreate,
    startEdit,
  } = useVisitForm();
  const totalCount = visits.length;

  return (
    <ScreenContainer
      description="Manual visit records now load from SQLite and can be created or edited from this screen."
      eyebrow="Visits"
      scroll
      title="Manual visit tracking will live here.">
      <Card
        subtitle="Read path, add/edit form wiring, and refresh are live. VISIT-03 will add cancel and active-visit rules to the same surface."
        title="Visit feed overview">
        <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
          {totalCount === 0
            ? 'No saved visits yet. Open the editor below to create the first completed visit for your primary gym.'
            : `${totalCount} visit${totalCount === 1 ? '' : 's'} loaded. ${activeCount} active and ${totalCount - activeCount} completed.`}
        </Text>
        <View style={[styles.actions, { marginTop: theme.spacing.lg }]}>
          <PrimaryButton
            label="Add Visit"
            onPress={() => {
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
          body="No saved visits exist yet. This screen now saves completed manual visits and derives duration from the entered times."
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
                    startEdit(visit);
                  }}
                />
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
