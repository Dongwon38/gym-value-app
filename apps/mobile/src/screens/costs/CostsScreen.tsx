import { useIsFocused } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CostEditorSheet } from '../../features/costs/components/CostEditorSheet';
import { useCostItems } from '../../features/costs/hooks/useCostItems';
import { useCostSetupForm } from '../../features/costs/hooks/useCostSetupForm';
import {
  formatCostItemCategory,
  formatCostItemDateRange,
} from '../../features/costs/useCases/costItems';
import {
  getStarterCostPreset,
  starterCostPresetKeys,
} from '../../features/costs/useCases/costSetup';
import {
  calculateRecurringMonthlySummary,
  formatCostCadenceSuffix,
  formatCostDisplayAmount,
  formatRecurringSummaryAmount,
  getCostCategoryBadge,
} from '../../features/costs/useCases/costSummary';
import { BottomSheet, Card, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

type ActiveSheet =
  | { kind: 'editor'; draftId: string }
  | { kind: 'template-picker' }
  | null;

export function CostsScreen() {
  const theme = useAppTheme();
  const isFocused = useIsFocused();
  const previousFocusRef = React.useRef<boolean | null>(null);
  const [activeSheet, setActiveSheet] = React.useState<ActiveSheet>(null);
  const [showInactive, setShowInactive] = React.useState(false);
  const { activeCount, costItems, inactiveCount, loadError, loadState, reload } =
    useCostItems();
  const activeCostItems = React.useMemo(
    () => costItems.filter(costItem => costItem.isActive),
    [costItems],
  );
  const inactiveCostItems = React.useMemo(
    () => costItems.filter(costItem => !costItem.isActive),
    [costItems],
  );
  const {
    addCustomLine,
    appSettings,
    customLines,
    deactivateLine,
    getStarterLineDraftId,
    hasPrimaryGym,
    reloadSupport,
    removeCustomLine,
    resetDraftState,
    restoreCostItem,
    save,
    saveFeedback,
    saveState,
    setLineFieldValue,
    starterLines,
    supportError,
    supportState,
    validationErrorsByLine,
  } = useCostSetupForm({
    costItems,
    onReload: reload,
  });

  React.useEffect(() => {
    if (previousFocusRef.current === null) {
      previousFocusRef.current = isFocused;
      return;
    }

    const wasFocused = previousFocusRef.current;
    previousFocusRef.current = isFocused;

    if (!wasFocused && isFocused) {
      reload();
      reloadSupport();
    }
  }, [isFocused, reload, reloadSupport]);

  const allDraftLines = React.useMemo(
    () => [...starterLines, ...customLines],
    [customLines, starterLines],
  );
  const selectedDraftLine =
    activeSheet?.kind === 'editor'
      ? allDraftLines.find(line => line.draftId === activeSheet.draftId) ?? null
      : null;
  const recurringMonthlyTotal = React.useMemo(
    () =>
      calculateRecurringMonthlySummary(
        activeCostItems,
        appSettings
          ? {
              defaultGstRate: appSettings.defaultGstRate,
              defaultPstRate: appSettings.defaultPstRate,
            }
          : null,
      ),
    [activeCostItems, appSettings],
  );

  const closeEditor = React.useCallback(() => {
    resetDraftState();
    setActiveSheet(null);
  }, [resetDraftState]);

  const openEditorForFeeItem = React.useCallback((feeItemId: string) => {
    const targetLine = allDraftLines.find(line => line.existingFeeItemId === feeItemId);

    if (targetLine) {
      setActiveSheet({ draftId: targetLine.draftId, kind: 'editor' });
    }
  }, [allDraftLines]);

  const handleOpenTemplate = React.useCallback(() => {
    setActiveSheet({ kind: 'template-picker' });
  }, []);

  const handleSelectStarterTemplate = React.useCallback((presetKey: (typeof starterCostPresetKeys)[number]) => {
    const draftId = getStarterLineDraftId(presetKey);

    if (!draftId) {
      return;
    }

    setActiveSheet({ draftId, kind: 'editor' });
  }, [getStarterLineDraftId]);

  const handleSelectCustomTemplate = React.useCallback(() => {
    const draftId = addCustomLine();
    setActiveSheet({ draftId, kind: 'editor' });
  }, [addCustomLine]);

  const handleSaveEditor = React.useCallback(async () => {
    const result = await save();

    if (result) {
      setActiveSheet(null);
      resetDraftState();
    }
  }, [resetDraftState, save]);

  const handleDeleteEditor = React.useCallback(async () => {
    if (!selectedDraftLine) {
      return;
    }

    if (selectedDraftLine.existingFeeItemId) {
      await deactivateLine(selectedDraftLine.draftId);
      setActiveSheet(null);
      return;
    }

    if (selectedDraftLine.kind === 'custom') {
      removeCustomLine(selectedDraftLine.draftId);
    }

    setActiveSheet(null);
    resetDraftState();
  }, [deactivateLine, removeCustomLine, resetDraftState, selectedDraftLine]);

  const handleRestoreInactive = React.useCallback((costItem: (typeof inactiveCostItems)[number]) => {
    const draftId = restoreCostItem(costItem);
    setActiveSheet({ draftId, kind: 'editor' });
  }, [restoreCostItem]);

  const headerAction = (
    <Pressable
      accessibilityLabel="Add cost"
      accessibilityRole="button"
      onPress={handleOpenTemplate}
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

  return (
    <ScreenContainer
      description="Track recurring and one-time gym costs."
      headerAction={headerAction}
      eyebrow="Costs"
      scroll
      showEyebrow={false}
      title="Costs">
      {loadState === 'loading' ? (
        <Card title="Loading costs">
          <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
            Reading local fee items and rebuilding the editor state.
          </Text>
        </Card>
      ) : null}

      {loadState === 'error' ? (
        <Card title="Cost list needs attention">
          <Text style={[styles.note, { color: theme.colors.danger }]}>
            {loadError ?? 'Unknown cost list query error.'}
          </Text>
        </Card>
      ) : null}

      {loadState === 'ready' ? (
        <>
          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryEyebrow, { color: theme.colors.textMuted }]}>
              Monthly recurring
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
              {formatRecurringSummaryAmount(recurringMonthlyTotal, appSettings)}
            </Text>
            <Text style={[styles.summarySubtext, { color: theme.colors.textMuted }]}>
              {appSettings?.currency ?? 'CAD'}
            </Text>
            <Text style={[styles.summaryMeta, { color: theme.colors.textSecondary }]}>
              {activeCount === 0 ? 'No active cost lines yet' : `${activeCount} active cost line${activeCount === 1 ? '' : 's'}`}
            </Text>
          </Card>

          {!hasPrimaryGym ? (
            <Card title="Set up your primary gym first">
              <Text style={[styles.note, { color: theme.colors.danger }]}>
                Save a primary gym in Settings before adding or editing cost lines.
              </Text>
            </Card>
          ) : null}

          {supportState === 'error' ? (
            <Card title="Cost setup support needs attention">
              <Text style={[styles.note, { color: theme.colors.danger }]}>
                {supportError ?? 'Cost setup metadata failed to load.'}
              </Text>
            </Card>
          ) : null}

          {saveFeedback && !selectedDraftLine ? (
            <Card title="Latest cost action">
              <Text
                style={[
                  styles.note,
                  {
                    color:
                      saveState === 'error'
                        ? theme.colors.danger
                        : saveState === 'success'
                          ? theme.colors.accent
                          : theme.colors.textSecondary,
                  },
                ]}>
                {saveFeedback}
              </Text>
            </Card>
          ) : null}

          {activeCostItems.length > 0 ? (
            <View style={styles.costList}>
              {activeCostItems.map(costItem => (
                <Pressable
                  key={costItem.id}
                  accessibilityRole="button"
                  onPress={() => {
                    openEditorForFeeItem(costItem.id);
                  }}
                  style={({ pressed }) => [
                    styles.costRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.costBadge,
                      {
                        backgroundColor: theme.colors.surfaceMuted,
                        borderRadius: theme.radius.pill,
                      },
                    ]}>
                    <Text style={[styles.costBadgeLabel, { color: theme.colors.accent }]}>
                      {getCostCategoryBadge(costItem.category)}
                    </Text>
                  </View>
                  <View style={styles.costMeta}>
                    <Text style={[styles.costTitle, { color: theme.colors.textPrimary }]}>
                      {costItem.label}
                    </Text>
                    <Text style={[styles.costSubtitle, { color: theme.colors.textMuted }]}>
                      {formatCostItemCategory(costItem.category)}
                    </Text>
                  </View>
                  <View style={styles.costAmountBlock}>
                    <Text style={[styles.costAmount, { color: theme.colors.textPrimary }]}>
                      {formatCostDisplayAmount(costItem, appSettings)}
                    </Text>
                    <Text style={[styles.costSuffix, { color: theme.colors.textMuted }]}>
                      {formatCostCadenceSuffix(costItem.cadence)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <Card title="No costs yet">
              <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
                Start with one of the four quick templates, or add a custom line.
              </Text>
            </Card>
          )}

          {inactiveCostItems.length > 0 ? (
            <Card title="Inactive costs">
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setShowInactive(currentValue => !currentValue);
                }}
                style={({ pressed }) => [
                  styles.inlineAction,
                  { opacity: pressed ? 0.74 : 1 },
                ]}>
                <Text style={[styles.inlineActionLabel, { color: theme.colors.accent }]}>
                  {showInactive
                    ? `Hide inactive (${inactiveCount})`
                    : `Show inactive (${inactiveCount})`}
                </Text>
              </Pressable>

              {showInactive ? (
                <View style={styles.inactiveList}>
                  {inactiveCostItems.map(costItem => (
                    <Pressable
                      key={costItem.id}
                      accessibilityRole="button"
                      onPress={() => {
                        handleRestoreInactive(costItem);
                      }}
                      style={({ pressed }) => [
                        styles.inactiveRow,
                        {
                          borderBottomColor: theme.colors.border,
                          opacity: pressed ? 0.78 : 1,
                        },
                      ]}>
                      <View style={styles.inactiveMeta}>
                        <Text style={[styles.inactiveTitle, { color: theme.colors.textPrimary }]}>
                          {costItem.label}
                        </Text>
                        <Text
                          style={[styles.inactiveSubtext, { color: theme.colors.textSecondary }]}>
                          {formatCostItemDateRange(costItem)}
                        </Text>
                      </View>
                      <Text style={[styles.restoreLabel, { color: theme.colors.accent }]}>
                        Restore
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : null}

      <BottomSheet
        onClose={() => {
          setActiveSheet(null);
        }}
        title="Add Cost"
        visible={activeSheet?.kind === 'template-picker'}>
        {starterCostPresetKeys.map(presetKey => {
          const preset = getStarterCostPreset(presetKey);
          const existingLine = starterLines.find(line => line.presetKey === presetKey);
          const hasExistingRow = Boolean(existingLine?.existingFeeItemId);

          return (
            <Pressable
              key={preset.key}
              accessibilityRole="button"
              onPress={() => {
                handleSelectStarterTemplate(presetKey);
              }}
              style={({ pressed }) => [
                styles.templateRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.sm,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}>
              <View style={styles.templateMeta}>
                <Text style={[styles.templateTitle, { color: theme.colors.textPrimary }]}>
                  {preset.title}
                </Text>
                <Text style={[styles.templateSubtitle, { color: theme.colors.textMuted }]}>
                  {preset.description}
                </Text>
              </View>
              <Text style={[styles.templateAction, { color: theme.colors.accent }]}>
                {hasExistingRow ? 'Edit' : 'Use'}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          onPress={handleSelectCustomTemplate}
          style={({ pressed }) => [
            styles.templateRow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.sm,
              opacity: pressed ? 0.82 : 1,
            },
          ]}>
          <View style={styles.templateMeta}>
            <Text style={[styles.templateTitle, { color: theme.colors.textPrimary }]}>
              Custom cost
            </Text>
            <Text style={[styles.templateSubtitle, { color: theme.colors.textMuted }]}>
              Add a line that does not fit the default four templates.
            </Text>
          </View>
          <Text style={[styles.templateAction, { color: theme.colors.accent }]}>
            Add
          </Text>
        </Pressable>
      </BottomSheet>

      <CostEditorSheet
        appSettings={appSettings}
        line={selectedDraftLine}
        onChangeField={(field, value) => {
          if (!selectedDraftLine) {
            return;
          }

          setLineFieldValue(selectedDraftLine.draftId, field, value);
        }}
        onClose={closeEditor}
        onDelete={handleDeleteEditor}
        onSave={handleSaveEditor}
        saveFeedback={saveFeedback}
        saveState={saveState}
        validationErrors={
          selectedDraftLine ? validationErrorsByLine[selectedDraftLine.draftId] : undefined
        }
        visible={activeSheet?.kind === 'editor'}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  circleButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  circleButtonLabel: {
    fontSize: 22,
    lineHeight: 24,
    marginTop: -1,
  },
  costAmount: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  costAmountBlock: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  costBadge: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  costBadgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  costList: {
    gap: 12,
  },
  costMeta: {
    flex: 1,
  },
  costRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  costSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  costSuffix: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  costTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  inactiveList: {
    gap: 12,
    marginTop: 12,
  },
  inactiveMeta: {
    flex: 1,
  },
  inactiveRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 12,
  },
  inactiveSubtext: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  inactiveTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  inlineAction: {
    alignSelf: 'flex-start',
  },
  inlineActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
  },
  restoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginLeft: 12,
  },
  summaryCard: {
    alignItems: 'center',
  },
  summaryEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  summarySubtext: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
  },
  summaryMeta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 46,
    marginTop: 8,
  },
  templateAction: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginLeft: 12,
  },
  templateMeta: {
    flex: 1,
  },
  templateRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  templateSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
});
