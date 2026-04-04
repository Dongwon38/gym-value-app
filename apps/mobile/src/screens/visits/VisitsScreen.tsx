import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MainTabParamList } from '../../app/navigation/navigationTypes';
import type { Visit } from '../../domain/models';
import { VisitEditorSheet } from '../../features/visits/components/VisitEditorSheet';
import { useVisitForm } from '../../features/visits/hooks/useVisitForm';
import { useVisits } from '../../features/visits/hooks/useVisits';
import { cancelVisit } from '../../features/visits/useCases/cancelVisit';
import {
  buildVisitHeatmap,
  filterVisitsByPeriod,
  formatVisitDateBadge,
  formatVisitFeedMeta,
  formatVisitStatusLabel,
  formatVisitSourceTypeLabel,
  formatVisitSummaryLine,
  formatVisitTimeRange,
  getVisitPeriodEmptyBody,
  getVisitPeriodEmptyTitle,
  type VisitPeriod,
} from '../../features/visits/useCases/visitTimeline';
import { shouldReviewActiveVisit } from '../../features/visits/useCases/sessionReview';
import { Card, EmptyState, PrimaryButton, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

type CancelState = 'idle' | 'saving' | 'success' | 'error';
type FeedbackTone = 'danger' | 'success';

const periodOptions: Array<{
  label: string;
  value: VisitPeriod;
}> = [
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
];

export function VisitsScreen() {
  const theme = useAppTheme();
  const isFocused = useIsFocused();
  const previousFocusRef = React.useRef<boolean | null>(null);
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [selectedPeriod, setSelectedPeriod] = React.useState<VisitPeriod>('year');
  const [cancelState, setCancelState] = React.useState<CancelState>('idle');
  const [feedback, setFeedback] = React.useState<{
    message: string;
    tone: FeedbackTone;
  } | null>(null);
  const [cancellingVisitId, setCancellingVisitId] = React.useState<string | null>(null);
  const { loadError, loadState, reload, visits } = useVisits();
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
    reloadContext,
    save,
    saveFeedback,
    saveState,
    setFieldValue,
    startCreate,
    startEdit,
  } = useVisitForm();

  React.useEffect(() => {
    if (previousFocusRef.current === null) {
      previousFocusRef.current = isFocused;
      return;
    }

    const wasFocused = previousFocusRef.current;
    previousFocusRef.current = isFocused;

    if (!wasFocused && isFocused) {
      reload();
      reloadContext();
    }
  }, [isFocused, reload, reloadContext]);

  const filteredVisits = React.useMemo(
    () => filterVisitsByPeriod(visits, selectedPeriod),
    [selectedPeriod, visits],
  );
  const heatmap = React.useMemo(
    () => buildVisitHeatmap(filteredVisits, selectedPeriod),
    [filteredVisits, selectedPeriod],
  );
  const needsActiveVisitReview =
    activeVisit !== null ? shouldReviewActiveVisit(activeVisit) : false;

  const headerAction = (
    <Pressable
      accessibilityLabel="Add visit"
      accessibilityRole="button"
      onPress={() => {
        setFeedback(null);

        if (!hasPrimaryGym) {
          navigation.navigate('Settings');
          return;
        }

        startCreate();
      }}
      style={({ pressed }) => [
        styles.circleButton,
        {
          backgroundColor: theme.colors.accent,
          borderRadius: theme.radius.pill,
          opacity: pressed ? 0.82 : 1,
        },
      ]}>
      <Text style={[styles.circleButtonLabel, { color: theme.colors.accentContrast }]}>
        +
      </Text>
    </Pressable>
  );

  async function handleCancelVisit(visit: Visit) {
    setCancelState('saving');
    setFeedback(null);
    setCancellingVisitId(visit.id);

    try {
      await cancelVisit(visit);
      markVisitCancelled(visit.id);

      if (editingVisit?.id === visit.id) {
        closeEditor();
      }

      reload();
      reloadContext();
      setCancelState('success');
      setFeedback({
        message: 'Visit removed from the default timeline.',
        tone: 'success',
      });
    } catch (error) {
      setCancelState('error');
      setFeedback({
        message:
          error instanceof Error ? error.message : 'Unknown visit cancel error.',
        tone: 'danger',
      });
    } finally {
      setCancellingVisitId(null);
    }
  }

  return (
    <ScreenContainer
      headerAction={headerAction}
      eyebrow="Visits"
      scroll
      showEyebrow={false}
      title="Visits">
      {loadState === 'loading' ? (
        <Card title="Loading visits">
          <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
            Rebuilding the local visit timeline.
          </Text>
        </Card>
      ) : null}

      {loadState === 'error' ? (
        <Card title="Visit timeline needs attention">
          <Text style={[styles.supportText, { color: theme.colors.danger }]}>
            {loadError ?? 'Unknown visit list query error.'}
          </Text>
          <PrimaryButton
            label="Retry"
            onPress={reload}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      ) : null}

      {loadState === 'ready' ? (
        <>
          <View
            style={[
              styles.segmentedControl,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.pill,
              },
            ]}>
            {periodOptions.map(option => {
              const isSelected = option.value === selectedPeriod;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedPeriod(option.value);
                  }}
                  style={({ pressed }) => [
                    styles.segmentOption,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.surface
                        : 'transparent',
                      borderRadius: theme.radius.pill,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.segmentLabel,
                      {
                        color: isSelected
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                      },
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Card style={styles.heatmapCard}>
            <VisitHeatmap heatmap={heatmap} />
          </Card>

          <Text style={[styles.summaryLine, { color: theme.colors.textMuted }]}>
            {formatVisitSummaryLine(visits, filteredVisits, selectedPeriod)}
          </Text>

          {feedback ? (
            <Text
              style={[
                styles.feedback,
                {
                  color:
                    feedback.tone === 'danger'
                      ? theme.colors.danger
                      : theme.colors.accent,
                },
              ]}>
              {feedback.message}
            </Text>
          ) : null}

          {activeVisit && needsActiveVisitReview ? (
            <Card title="Review active visit">
              <Text style={[styles.supportText, { color: theme.colors.warning }]}>
                The current active visit has been running for a while. Finish or cancel it to keep duration and KPI stats accurate.
              </Text>
            </Card>
          ) : null}

          {!hasPrimaryGym && visits.length === 0 ? (
            <EmptyState
              actionLabel="Open Settings"
              body="Set up your primary gym before adding the first visit."
              onActionPress={() => {
                navigation.navigate('Settings');
              }}
              title="Primary gym required"
            />
          ) : null}

          {hasPrimaryGym && visits.length === 0 ? (
            <EmptyState
              actionLabel="Add Visit"
              body="Create the first visit to start building your visit timeline."
              onActionPress={() => {
                setFeedback(null);
                startCreate();
              }}
              title="No visits saved yet"
            />
          ) : null}

          {visits.length > 0 && filteredVisits.length === 0 ? (
            <EmptyState
              actionLabel={selectedPeriod === 'all' ? 'Add Visit' : 'Show All'}
              body={getVisitPeriodEmptyBody(selectedPeriod)}
              onActionPress={() => {
                if (selectedPeriod === 'all') {
                  setFeedback(null);
                  startCreate();
                  return;
                }

                setSelectedPeriod('all');
              }}
              title={getVisitPeriodEmptyTitle(selectedPeriod)}
            />
          ) : null}

          {filteredVisits.length > 0 ? (
            <View style={styles.visitList}>
              {filteredVisits.map(visit => (
                <Pressable
                  key={visit.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setFeedback(null);
                    startEdit(visit);
                  }}
                  style={({ pressed }) => [
                    styles.visitRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor:
                        visit.status === 'active'
                          ? theme.colors.accent
                          : theme.colors.border,
                      borderRadius: theme.radius.md,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.dateBadge,
                      {
                        backgroundColor:
                          visit.status === 'active'
                            ? theme.colors.surfaceMuted
                            : theme.colors.background,
                        borderRadius: theme.radius.sm,
                      },
                    ]}>
                    <Text style={[styles.dateBadgeLabel, { color: theme.colors.textMuted }]}>
                      {formatVisitDateBadge(visit)}
                    </Text>
                  </View>

                  <View style={styles.visitMeta}>
                    <Text style={[styles.visitTime, { color: theme.colors.textPrimary }]}>
                      {formatVisitTimeRange(visit)}
                    </Text>
                    <Text
                      style={[styles.visitSubtitle, { color: theme.colors.textMuted }]}>
                      {formatVisitFeedMeta(visit)}
                    </Text>
                  </View>

                  <View style={styles.trailingMeta}>
                    <Text
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            visit.status === 'active'
                              ? theme.colors.surfaceMuted
                              : theme.colors.background,
                          color:
                            visit.status === 'active'
                              ? theme.colors.accent
                              : theme.colors.textMuted,
                        },
                      ]}>
                      {formatVisitStatusLabel(visit.status)}
                    </Text>
                    <Text style={[styles.editHint, { color: theme.colors.textMuted }]}>
                      Edit
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <VisitEditorSheet
        deleteDisabled={cancelState === 'saving' && cancellingVisitId === editingVisit?.id}
        deleteLabel={editingVisit?.status === 'active' ? 'Cancel Visit' : 'Delete Visit'}
        derivedDurationMinutes={derivedDurationMinutes}
        editorMode={editorMode === 'closed' ? 'create' : editorMode}
        formValues={formValues}
        hasPrimaryGym={hasPrimaryGym || editingVisit !== null}
        onClose={closeEditor}
        onDelete={
          editingVisit
            ? () => {
                handleCancelVisit(editingVisit);
              }
            : undefined
        }
        onSave={async () => {
          const savedVisit = await save();

          if (savedVisit) {
            closeEditor();
            reload();
            reloadContext();
            setFeedback({
              message: editingVisit ? 'Visit updated.' : 'Visit added.',
              tone: 'success',
            });
          }
        }}
        onSetFieldValue={setFieldValue}
        primaryGymName={editingVisit ? undefined : primaryGym?.name}
        saveFeedback={saveFeedback}
        saveState={saveState}
        validationErrors={errors}
        visitSourceLabel={formatVisitSourceTypeLabel(editingVisit?.source ?? 'manual')}
        visible={editorMode !== 'closed'}
      />
    </ScreenContainer>
  );
}

function VisitHeatmap({
  heatmap,
}: {
  heatmap: ReturnType<typeof buildVisitHeatmap>;
}) {
  const theme = useAppTheme();

  return (
    <View>
      <View style={styles.heatmapHeader}>
        <View style={styles.heatmapWeekdaySpacer} />
        {heatmap.weeks.map((week, index) => (
          <View key={`${week.label ?? 'week'}_${index}`} style={styles.heatmapWeek}>
            <Text style={[styles.heatmapMonthLabel, { color: theme.colors.textMuted }]}>
              {week.label ?? ' '}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.heatmapRows}>
        <View style={styles.heatmapWeekdayColumn}>
          {heatmap.weekdayLabels.map((label, index) => (
            <Text
              key={`${label}_${index}`}
              style={[styles.heatmapWeekdayLabel, { color: theme.colors.textMuted }]}>
              {label || ' '}
            </Text>
          ))}
        </View>

        <View style={styles.heatmapWeeksRow}>
          {heatmap.weeks.map((week, index) => (
            <View key={`visit_week_${index}`} style={styles.heatmapWeek}>
              {week.days.map(day => (
                <View
                  key={day.dateKey}
                  style={[
                    styles.heatmapCell,
                    {
                      backgroundColor: getHeatmapCellColor(day.level, theme),
                      borderColor:
                        day.level === 0
                          ? theme.colors.border
                          : getHeatmapCellBorderColor(day.level, theme),
                    },
                    day.isFuture || day.isMuted ? styles.heatmapCellDimmed : null,
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function getHeatmapCellColor(
  level: 0 | 1 | 2 | 3,
  theme: ReturnType<typeof useAppTheme>,
) {
  if (level === 0) {
    return theme.colors.background;
  }

  if (level === 1) {
    return '#DCEEE8';
  }

  if (level === 2) {
    return '#B7DFD1';
  }

  return '#82BEAA';
}

function getHeatmapCellBorderColor(
  level: 0 | 1 | 2 | 3,
  theme: ReturnType<typeof useAppTheme>,
) {
  if (level === 0) {
    return theme.colors.border;
  }

  if (level === 1) {
    return '#C7E3D9';
  }

  if (level === 2) {
    return '#A3D1C1';
  }

  return '#6EA993';
}

const styles = StyleSheet.create({
  circleButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  circleButtonLabel: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
    marginTop: -1,
  },
  dateBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 54,
    paddingHorizontal: 10,
  },
  dateBadgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  editHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  feedback: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -2,
  },
  heatmapCard: {
    paddingTop: 14,
  },
  heatmapCell: {
    borderWidth: 1,
    borderRadius: 4,
    height: 14,
    width: 14,
  },
  heatmapCellDimmed: {
    opacity: 0.45,
  },
  heatmapHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  heatmapMonthLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  heatmapRows: {
    flexDirection: 'row',
    gap: 8,
  },
  heatmapWeek: {
    gap: 5,
  },
  heatmapWeekdayColumn: {
    gap: 5,
    justifyContent: 'flex-end',
    paddingTop: 19,
  },
  heatmapWeekdayLabel: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    width: 10,
  },
  heatmapWeekdaySpacer: {
    width: 18,
  },
  heatmapWeeksRow: {
    flexDirection: 'row',
    gap: 5,
  },
  segmentedControl: {
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  segmentOption: {
    alignItems: 'center',
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  statusPill: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textAlign: 'center',
  },
  summaryLine: {
    fontSize: 14,
    lineHeight: 18,
  },
  supportText: {
    fontSize: 14,
    lineHeight: 20,
  },
  trailingMeta: {
    alignItems: 'flex-end',
    gap: 10,
  },
  visitList: {
    gap: 12,
  },
  visitMeta: {
    flex: 1,
    gap: 4,
  },
  visitRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 84,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  visitSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  visitTime: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
});
