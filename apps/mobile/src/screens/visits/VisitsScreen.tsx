import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PencilLine, Plus } from 'lucide-react-native';

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
  formatVisitSourceTypeLabel,
  formatVisitSummaryLine,
  formatVisitTimeRange,
  getVisitPeriodEmptyBody,
  getVisitPeriodEmptyTitle,
  type VisitPeriod,
} from '../../features/visits/useCases/visitTimeline';
import { shouldReviewActiveVisit } from '../../features/visits/useCases/sessionReview';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Row,
  Screen,
  SegmentedControl,
  Text,
} from '../../ui';
import { appTheme } from '../../ui/theme';

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
    <Screen
      headerAction={
        <IconButton
          accessibilityLabel="Add visit"
          onPress={() => {
            setFeedback(null);

            if (!hasPrimaryGym) {
              navigation.navigate('Settings');
              return;
            }

            startCreate();
          }}>
          <Plus color="#FFFFFF" size={18} strokeWidth={2.5} />
        </IconButton>
      }
      scroll
      title="Visits">
      {loadState === 'loading' ? (
        <Card description="Rebuilding the local visit timeline." title="Loading visits" />
      ) : null}

      {loadState === 'error' ? (
        <Card title="Visit timeline needs attention">
          <Text tone="destructive" variant="bodyMuted">
            {loadError ?? 'Unknown visit list query error.'}
          </Text>
          <Button className="mt-4 self-start" label="Retry" onPress={reload} />
        </Card>
      ) : null}

      {loadState === 'ready' ? (
        <>
          <Animated.View entering={FadeInDown.delay(20).duration(220)}>
            <SegmentedControl
              onChange={setSelectedPeriod}
              options={periodOptions}
              value={selectedPeriod}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50).duration(220)}>
            <Card padding="compact" shadow="soft">
              <VisitHeatmap heatmap={heatmap} />
            </Card>
          </Animated.View>

          <Text className="-mt-1" tone="secondary" variant="bodyMuted">
            {formatVisitSummaryLine(visits, filteredVisits, selectedPeriod)}
          </Text>

          {feedback ? (
            <Text
              tone={feedback.tone === 'danger' ? 'destructive' : 'success'}
              variant="bodyMuted">
              {feedback.message}
            </Text>
          ) : null}

          {activeVisit && needsActiveVisitReview ? (
            <Card title="Review active visit">
              <Text tone="warning" variant="bodyMuted">
                The current active visit has been running for a while. Finish or cancel it to
                keep duration and KPI stats accurate.
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
            <Animated.View className="gap-3" entering={FadeInDown.delay(80).duration(220)}>
              {filteredVisits.map(visit => (
                <Pressable
                  key={visit.id}
                  className="active:opacity-90"
                  onPress={() => {
                    setFeedback(null);
                    startEdit(visit);
                  }}>
                  <Card
                    className={visit.status === 'active' ? 'border-success/60' : ''}
                    padding="compact"
                    shadow="soft">
                    <Row className="gap-3" justify="between">
                      <Row align="center" className="flex-1 gap-3">
                        <View className="min-w-[48px]">
                          <Text className="text-center" tone="tertiary" variant="listMeta">
                            {formatVisitDateBadge(visit)}
                          </Text>
                        </View>
                        <View className="flex-1 gap-0.5">
                          <Text variant="listTitle">{formatVisitTimeRange(visit)}</Text>
                          <Text tone="secondary" variant="listMeta">
                            {formatVisitFeedMeta(visit)}
                          </Text>
                        </View>
                      </Row>
                      <View className="items-end gap-2">
                        {visit.status === 'active' ? (
                          <Badge label="Active" tone="success" />
                        ) : null}
                        <PencilLine
                          color={appTheme.colors.iconMuted}
                          size={16}
                          strokeWidth={2}
                        />
                      </View>
                    </Row>
                  </Card>
                </Pressable>
              ))}
            </Animated.View>
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
    </Screen>
  );
}

function VisitHeatmap({
  heatmap,
}: {
  heatmap: ReturnType<typeof buildVisitHeatmap>;
}) {
  return (
    <View className="gap-3">
      <Row className="pl-6 pr-1">
        {heatmap.weeks.map((week, index) => (
          <View key={`${week.label ?? 'week'}_${index}`} className="flex-1 items-center">
            <Text tone="tertiary" variant="listMeta">
              {week.label ?? ' '}
            </Text>
          </View>
        ))}
      </Row>

      <Row align="end" className="gap-2">
        <View className="gap-[6px] pb-[1px]">
          {heatmap.weekdayLabels.map((label, index) => (
            <Text key={`${label}_${index}`} tone="tertiary" variant="listMeta">
              {label || ' '}
            </Text>
          ))}
        </View>

        <Row className="flex-1 gap-[6px]">
          {heatmap.weeks.map((week, index) => (
            <View key={`visit_week_${index}`} className="flex-1 gap-[6px]">
              {week.days.map(day => (
                <View
                  key={day.dateKey}
                  className="h-3.5 rounded-[4px] border"
                  style={getHeatmapCellStyle(day)}
                />
              ))}
            </View>
          ))}
        </Row>
      </Row>
    </View>
  );
}

function getHeatmapCellColor(level: 0 | 1 | 2 | 3) {
  if (level === 0) {
    return '#F0EEE8';
  }

  if (level === 1) {
    return '#DDEFE2';
  }

  if (level === 2) {
    return '#C5E6D0';
  }

  return '#A5D4B6';
}

function getHeatmapCellBorderColor(level: 0 | 1 | 2 | 3) {
  if (level === 0) {
    return '#E3DED5';
  }

  if (level === 1) {
    return '#D6EAD8';
  }

  if (level === 2) {
    return '#BCDEC8';
  }

  return '#9CCAAD';
}

function getHeatmapCellStyle(day: {
  isFuture: boolean;
  isMuted: boolean;
  level: 0 | 1 | 2 | 3;
}) {
  return {
    backgroundColor: getHeatmapCellColor(day.level),
    borderColor: getHeatmapCellBorderColor(day.level),
    opacity: day.isFuture || day.isMuted ? 0.42 : 1,
  };
}
