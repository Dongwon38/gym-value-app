import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Check, ChevronDown, PencilLine, Plus } from 'lucide-react-native';

import type { MainTabParamList } from '../../app/navigation/navigationTypes';
import type { Visit } from '../../domain/models';
import { VisitEditorSheet } from '../../features/visits/components/VisitEditorSheet';
import { useVisitForm } from '../../features/visits/hooks/useVisitForm';
import { useVisits } from '../../features/visits/hooks/useVisits';
import { cancelVisit } from '../../features/visits/useCases/cancelVisit';
import {
  buildVisitHeatmap,
  buildVisitYearOptions,
  filterVisitsByPeriod,
  formatVisitDateBadge,
  formatVisitFeedMeta,
  formatVisitPickerLabel,
  formatVisitSourceTypeLabel,
  formatVisitSummaryLine,
  formatVisitTimeRange,
  getVisitPeriodEmptyBody,
  getVisitPeriodEmptyTitle,
  getVisitPeriodLabel,
  type VisitPeriod,
  type VisitPeriodSelection,
} from '../../features/visits/useCases/visitTimeline';
import { shouldReviewActiveVisit } from '../../features/visits/useCases/sessionReview';
import {
  Badge,
  BottomSheetFormShell,
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
];

const monthPickerOptions = [
  { label: 'Jan', value: 0 },
  { label: 'Feb', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Apr', value: 3 },
  { label: 'May', value: 4 },
  { label: 'Jun', value: 5 },
  { label: 'Jul', value: 6 },
  { label: 'Aug', value: 7 },
  { label: 'Sep', value: 8 },
  { label: 'Oct', value: 9 },
  { label: 'Nov', value: 10 },
  { label: 'Dec', value: 11 },
] as const;

export function VisitsScreen() {
  const nowRef = React.useRef(new Date());
  const now = nowRef.current;
  const isFocused = useIsFocused();
  const previousFocusRef = React.useRef<boolean | null>(null);
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [selectedPeriod, setSelectedPeriod] = React.useState<VisitPeriod>('year');
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth());
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [pickerVisible, setPickerVisible] = React.useState(false);
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
  const periodSelection = React.useMemo<VisitPeriodSelection>(
    () => ({
      month: selectedMonth,
      year: selectedYear,
    }),
    [selectedMonth, selectedYear],
  );

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
    () => filterVisitsByPeriod(visits, selectedPeriod, periodSelection),
    [periodSelection, selectedPeriod, visits],
  );
  const heatmap = React.useMemo(
    () => buildVisitHeatmap(visits, selectedYear, now),
    [now, selectedYear, visits],
  );
  const pickerLabel = React.useMemo(
    () => formatVisitPickerLabel(selectedPeriod, periodSelection),
    [periodSelection, selectedPeriod],
  );
  const yearOptions = React.useMemo(
    () => buildVisitYearOptions(visits, selectedYear, now),
    [now, selectedYear, visits],
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
            <Row align="center" className="gap-3">
              <View className="flex-1">
                <SegmentedControl
                  onChange={setSelectedPeriod}
                  options={periodOptions}
                  value={selectedPeriod}
                />
              </View>
              <Pressable
                className="min-h-11 flex-row items-center gap-1 rounded-full border border-border/70 bg-card px-4 active:opacity-90"
                onPress={() => {
                  setPickerVisible(true);
                }}>
                <Text variant="listMeta">{pickerLabel}</Text>
                <ChevronDown
                  color={appTheme.colors.iconMuted}
                  size={16}
                  strokeWidth={2.2}
                />
              </Pressable>
            </Row>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50).duration(220)}>
            <Card padding="compact" shadow="soft">
              <VisitHeatmap heatmap={heatmap} />
            </Card>
          </Animated.View>

          <Text className="-mt-1" tone="secondary" variant="bodyMuted">
            {formatVisitSummaryLine(filteredVisits, selectedPeriod, periodSelection)}
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
              actionLabel={selectedPeriod === 'month' ? 'Show Year' : 'Add Visit'}
              body={getVisitPeriodEmptyBody(selectedPeriod, periodSelection)}
              onActionPress={() => {
                if (selectedPeriod === 'year') {
                  setFeedback(null);
                  startCreate();
                  return;
                }

                setSelectedPeriod('year');
              }}
              title={getVisitPeriodEmptyTitle(selectedPeriod, periodSelection)}
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

      <BottomSheetFormShell
        onClose={() => {
          setPickerVisible(false);
        }}
        subtitle={
          selectedPeriod === 'month'
            ? 'Pick the month for the visit list. The heatmap stays on the full year.'
            : 'Pick the year for the heatmap and visit list.'
        }
        title={`Choose ${getVisitPeriodLabel(selectedPeriod)}`}
        visible={pickerVisible}>
        <View className="gap-2">
          {selectedPeriod === 'month'
            ? monthPickerOptions.map(option => {
                const isSelected = option.value === selectedMonth;

                return (
                  <Pressable
                    key={option.value}
                    className="flex-row items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 active:bg-muted-card"
                    onPress={() => {
                      setSelectedMonth(option.value);
                      setPickerVisible(false);
                    }}>
                    <Text variant="body">{`${option.label} ${selectedYear}`}</Text>
                    {isSelected ? (
                      <Check
                        color={appTheme.colors.success}
                        size={16}
                        strokeWidth={2.4}
                      />
                    ) : null}
                  </Pressable>
                );
              })
            : yearOptions.map(option => {
                const isSelected = option === selectedYear;

                return (
                  <Pressable
                    key={option}
                    className="flex-row items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 active:bg-muted-card"
                    onPress={() => {
                      setSelectedYear(option);
                      setPickerVisible(false);
                    }}>
                    <Text variant="body">{String(option)}</Text>
                    {isSelected ? (
                      <Check
                        color={appTheme.colors.success}
                        size={16}
                        strokeWidth={2.4}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
        </View>
      </BottomSheetFormShell>
    </Screen>
  );
}

function VisitHeatmap({
  heatmap,
}: {
  heatmap: ReturnType<typeof buildVisitHeatmap>;
}) {
  const monthMarkers = heatmap.weeks
    .map((week, index) =>
      week.label
        ? {
            key: `${week.label}_${index}`,
            label: week.label,
            left: index * (HEATMAP_CELL_SIZE + HEATMAP_CELL_GAP),
          }
        : null,
    )
    .filter((marker): marker is { key: string; label: string; left: number } => marker !== null);

  const gridWidth =
    heatmap.weeks.length * HEATMAP_CELL_SIZE +
    Math.max(heatmap.weeks.length - 1, 0) * HEATMAP_CELL_GAP;

  return (
    <View className="gap-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View className="gap-3 pb-1">
          <View
            className="relative"
            style={{
              height: HEATMAP_MONTH_LABEL_HEIGHT,
              marginLeft: HEATMAP_WEEKDAY_LABEL_WIDTH + HEATMAP_GRID_OFFSET,
              width: gridWidth,
            }}>
            {monthMarkers.map(marker => (
              <Text
                key={marker.key}
                numberOfLines={1}
                style={[visitHeatmapStyles.monthLabel, { left: marker.left }]}
                tone="tertiary"
                variant="listMeta">
                {marker.label}
              </Text>
            ))}
          </View>

          <Row align="start" className="gap-2">
            <View
              className="pb-[1px]"
              style={{
                rowGap: HEATMAP_CELL_GAP,
                width: HEATMAP_WEEKDAY_LABEL_WIDTH,
              }}>
              {heatmap.weekdayLabels.map((label, index) => (
                <View
                  key={`${label}_${index}`}
                  style={visitHeatmapStyles.weekdayLabelRow}>
                  <Text tone="tertiary" variant="listMeta">
                    {label || ' '}
                  </Text>
                </View>
              ))}
            </View>

            <Row
              className="justify-start"
              style={{
                columnGap: HEATMAP_CELL_GAP,
                paddingLeft: HEATMAP_GRID_OFFSET,
                width: gridWidth + HEATMAP_GRID_OFFSET,
              }}>
              {heatmap.weeks.map((week, index) => (
                <View
                  key={`visit_week_${index}`}
                  style={{
                    rowGap: HEATMAP_CELL_GAP,
                    width: HEATMAP_CELL_SIZE,
                  }}>
                  {week.days.map(day => (
                    <View
                      key={day.dateKey}
                      className="rounded-[4px] border"
                      style={[
                        {
                          height: HEATMAP_CELL_SIZE,
                          width: HEATMAP_CELL_SIZE,
                        },
                        getHeatmapCellStyle(day),
                      ]}
                    />
                  ))}
                </View>
              ))}
            </Row>
          </Row>
        </View>
      </ScrollView>
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

const HEATMAP_CELL_SIZE = 12;
const HEATMAP_CELL_GAP = 4;
const HEATMAP_GRID_OFFSET = 2;
const HEATMAP_MONTH_LABEL_HEIGHT = 16;
const HEATMAP_WEEKDAY_LABEL_WIDTH = 14;

const visitHeatmapStyles = {
  monthLabel: {
    position: 'absolute' as const,
    top: 0,
  },
  weekdayLabelRow: {
    height: HEATMAP_CELL_SIZE,
    justifyContent: 'center' as const,
  },
};
