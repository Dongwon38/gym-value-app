import { useIsFocused } from '@react-navigation/native';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CalendarDays,
  CirclePlus,
  Lock,
  Plus,
  Repeat,
  Wallet,
  Zap,
} from 'lucide-react-native';

import { CostEditorSheet } from '../../features/costs/components/CostEditorSheet';
import { useCostItems } from '../../features/costs/hooks/useCostItems';
import { useCostSetupForm } from '../../features/costs/hooks/useCostSetupForm';
import { formatCostItemDateRange } from '../../features/costs/useCases/costItems';
import {
  starterCostPresetKeys,
} from '../../features/costs/useCases/costSetup';
import {
  calculateRecurringMonthlySummary,
  formatCostCadenceSuffix,
  formatCostDisplayAmount,
  formatRecurringSummaryAmount,
} from '../../features/costs/useCases/costSummary';
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Row,
  Screen,
  Text,
} from '../../ui';
import { appTheme } from '../../ui/theme';

type ActiveSheet =
  | { draftId: string; kind: 'editor'; source: 'create' | 'edit' }
  | null;

export function CostsScreen() {
  const isFocused = useIsFocused();
  const previousFocusRef = React.useRef<boolean | null>(null);
  const [activeSheet, setActiveSheet] = React.useState<ActiveSheet>(null);
  const [createCustomDraftId, setCreateCustomDraftId] = React.useState<string | null>(null);
  const [showInactive, setShowInactive] = React.useState(false);
  const { costItems, inactiveCount, loadError, loadState, reload } =
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
    setCreateCustomDraftId(null);
    resetDraftState();
    setActiveSheet(null);
  }, [resetDraftState]);

  const openEditorForFeeItem = React.useCallback(
    (feeItemId: string) => {
      const targetLine = allDraftLines.find(line => line.existingFeeItemId === feeItemId);

      if (targetLine) {
        setActiveSheet({
          draftId: targetLine.draftId,
          kind: 'editor',
          source: 'edit',
        });
      }
    },
    [allDraftLines],
  );

  const handleSelectStarterTemplate = React.useCallback(
    (presetKey: (typeof starterCostPresetKeys)[number]) => {
      const draftId = getStarterLineDraftId(presetKey);

      if (!draftId) {
        return;
      }

      setActiveSheet({ draftId, kind: 'editor', source: 'create' });
    },
    [getStarterLineDraftId],
  );

  const handleSelectCustomTemplate = React.useCallback(() => {
    if (createCustomDraftId) {
      setActiveSheet({ draftId: createCustomDraftId, kind: 'editor', source: 'create' });
      return;
    }

    const draftId = addCustomLine();
    setCreateCustomDraftId(draftId);
    setActiveSheet({ draftId, kind: 'editor', source: 'create' });
  }, [addCustomLine, createCustomDraftId]);

  const handleOpenTemplate = React.useCallback(() => {
    const preferredStarterLine = starterLines.find(line => !line.existingFeeItemId);

    setCreateCustomDraftId(null);

    if (preferredStarterLine) {
      setActiveSheet({
        draftId: preferredStarterLine.draftId,
        kind: 'editor',
        source: 'create',
      });
      return;
    }

    const draftId = addCustomLine();
    setCreateCustomDraftId(draftId);
    setActiveSheet({ draftId, kind: 'editor', source: 'create' });
  }, [addCustomLine, starterLines]);

  const handleSaveEditor = React.useCallback(async () => {
    const result = await save();

    if (result) {
      setCreateCustomDraftId(null);
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

      if (activeSheet?.source === 'create') {
        const fallbackStarterLine = starterLines.find(line => !line.existingFeeItemId);

        setCreateCustomDraftId(null);

        if (fallbackStarterLine) {
          setActiveSheet({
            draftId: fallbackStarterLine.draftId,
            kind: 'editor',
            source: 'create',
          });
          return;
        }
      }
    }

    setActiveSheet(null);
    resetDraftState();
    setCreateCustomDraftId(null);
  }, [
    activeSheet?.source,
    deactivateLine,
    removeCustomLine,
    resetDraftState,
    selectedDraftLine,
    starterLines,
  ]);

  const handleRestoreInactive = React.useCallback(
    (costItem: (typeof inactiveCostItems)[number]) => {
      const draftId = restoreCostItem(costItem);
      setActiveSheet({ draftId, kind: 'editor' });
    },
    [restoreCostItem],
  );

  return (
    <Screen
      description="Track recurring and one-time gym costs."
      headerAction={
        <IconButton accessibilityLabel="Add cost" onPress={handleOpenTemplate}>
          <Plus color="#FFFFFF" size={18} strokeWidth={2.5} />
        </IconButton>
      }
      scroll
      title="Costs">
      {loadState === 'loading' ? (
        <Card description="Reading local fee items and rebuilding the editor state." title="Loading costs" />
      ) : null}

      {loadState === 'error' ? (
        <Card title="Cost list needs attention">
          <Text tone="destructive" variant="bodyMuted">
            {loadError ?? 'Unknown cost list query error.'}
          </Text>
        </Card>
      ) : null}

      {loadState === 'ready' ? (
        <>
          <Animated.View entering={FadeInDown.delay(20).duration(220)}>
            <Card className="items-center py-6" shadow="soft">
              <View className="items-center gap-2">
                <Text variant="cardEyebrow">Monthly recurring</Text>
                <Text variant="kpiValue">
                  {formatRecurringSummaryAmount(recurringMonthlyTotal, appSettings)}
                </Text>
                <Text tone="secondary" variant="bodyMuted">
                  {appSettings?.currency ?? 'CAD'}
                </Text>
              </View>
            </Card>
          </Animated.View>

          {!hasPrimaryGym ? (
            <Card title="Set up your primary gym first">
              <Text tone="destructive" variant="bodyMuted">
                Save a primary gym in Settings before adding or editing cost lines.
              </Text>
            </Card>
          ) : null}

          {supportState === 'error' ? (
            <Card title="Cost setup support needs attention">
              <Text tone="destructive" variant="bodyMuted">
                {supportError ?? 'Cost setup metadata failed to load.'}
              </Text>
            </Card>
          ) : null}

          {saveFeedback && !selectedDraftLine ? (
            <Card title="Latest cost action">
              <Text
                tone={
                  saveState === 'error'
                    ? 'destructive'
                    : saveState === 'success'
                      ? 'success'
                      : 'secondary'
                }
                variant="bodyMuted">
                {saveFeedback}
              </Text>
            </Card>
          ) : null}

          {activeCostItems.length > 0 ? (
            <Animated.View className="gap-3" entering={FadeInDown.delay(60).duration(220)}>
              {activeCostItems.map(costItem => (
                <Pressable
                  key={costItem.id}
                  className="active:opacity-90"
                  onPress={() => {
                    openEditorForFeeItem(costItem.id);
                  }}>
                  <Card padding="compact" shadow="soft">
                    <Row className="gap-3" justify="between">
                      <Row align="center" className="flex-1 gap-3">
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-success-soft">
                          {renderCostIcon(costItem.category)}
                        </View>
                        <View className="flex-1 gap-0.5">
                          <Text variant="listTitle">{costItem.label}</Text>
                          <Text tone="secondary" variant="listMeta">
                            {formatCostSubtitle(costItem.category)}
                          </Text>
                        </View>
                      </Row>
                      <View className="items-end gap-0.5">
                        <Text variant="listTitle">
                          {formatCostDisplayAmount(costItem, appSettings)}
                        </Text>
                        <Text tone="secondary" variant="listMeta">
                          {formatCostCadenceSuffix(costItem.cadence)}
                        </Text>
                      </View>
                    </Row>
                  </Card>
                </Pressable>
              ))}
            </Animated.View>
          ) : (
            <EmptyState
              actionLabel="Add Cost"
              body="Start with one of the four quick templates, or add a custom line."
              onActionPress={handleOpenTemplate}
              title="No costs yet"
            />
          )}

          {inactiveCostItems.length > 0 ? (
            <Card
              title="Inactive costs"
              description={
                showInactive
                  ? 'Tap a row to restore it back into the active setup.'
                  : undefined
              }>
              <Button
                className="self-start"
                label={
                  showInactive
                    ? `Hide inactive (${inactiveCount})`
                    : `Show inactive (${inactiveCount})`
                }
                onPress={() => {
                  setShowInactive(currentValue => !currentValue);
                }}
                size="sm"
                variant="ghost"
              />

              {showInactive ? (
                <View className="mt-1 gap-3">
                  {inactiveCostItems.map(costItem => (
                    <Pressable
                      key={costItem.id}
                      className="active:opacity-85"
                      onPress={() => {
                        handleRestoreInactive(costItem);
                      }}>
                      <Row
                        className="border-b border-border/70 pb-3 last:border-b-0"
                        justify="between">
                        <View className="flex-1 gap-1">
                          <Text variant="body">{costItem.label}</Text>
                          <Text tone="secondary" variant="listMeta">
                            {formatCostItemDateRange(costItem)}
                          </Text>
                        </View>
                        <Text tone="success" variant="listMeta">
                          Restore
                        </Text>
                      </Row>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : null}

      <CostEditorSheet
        appSettings={appSettings}
        line={selectedDraftLine}
        onSelectKind={kind => {
          if (kind === 'custom') {
            handleSelectCustomTemplate();
            return;
          }

          handleSelectStarterTemplate(kind);
        }}
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
        showKindSelector={activeSheet?.source === 'create'}
        validationErrors={
          selectedDraftLine ? validationErrorsByLine[selectedDraftLine.draftId] : undefined
        }
        visible={Boolean(activeSheet && activeSheet.kind === 'editor')}
      />
    </Screen>
  );
}

function renderCostIcon(category: Parameters<typeof formatCostSubtitle>[0]) {
  switch (category) {
    case 'monthly_membership':
      return <Repeat color={appTheme.colors.success} size={18} strokeWidth={2} />;
    case 'annual_fee':
      return <CalendarDays color={appTheme.colors.success} size={18} strokeWidth={2} />;
    case 'signup_fee':
      return <CirclePlus color={appTheme.colors.success} size={18} strokeWidth={2} />;
    case 'locker_fee':
      return <Lock color={appTheme.colors.success} size={18} strokeWidth={2} />;
    case 'pt':
      return <Zap color={appTheme.colors.success} size={18} strokeWidth={2} />;
    case 'other':
    default:
      return <Wallet color={appTheme.colors.success} size={18} strokeWidth={2} />;
  }
}

function formatCostSubtitle(category: Parameters<typeof renderCostIcon>[0]) {
  switch (category) {
    case 'monthly_membership':
      return 'Membership';
    case 'annual_fee':
      return 'Fee';
    case 'signup_fee':
      return 'Signup';
    case 'locker_fee':
      return 'Add-on';
    case 'pt':
      return 'Training';
    case 'other':
    default:
      return 'Custom';
  }
}
