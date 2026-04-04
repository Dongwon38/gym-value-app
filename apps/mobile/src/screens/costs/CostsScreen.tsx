import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CostSetupCard } from '../../features/costs/components/CostSetupCard';
import { useCostItems } from '../../features/costs/hooks/useCostItems';
import { useCostSetupForm } from '../../features/costs/hooks/useCostSetupForm';
import {
  formatCostItemAmount,
  formatCostItemCadence,
  formatCostItemCategory,
  formatCostItemDateRange,
} from '../../features/costs/useCases/costItems';
import { Card, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

export function CostsScreen() {
  const theme = useAppTheme();
  const { activeCount, costItems, inactiveCount, loadError, loadState, reload } =
    useCostItems();
  const inactiveCostItems = costItems.filter(costItem => !costItem.isActive);
  const {
    addCustomLine,
    appSettings,
    customLines,
    hasPrimaryGym,
    primaryGym,
    removeCustomLine,
    save,
    saveFeedback,
    saveState,
    setLineEnabled,
    setLineFieldValue,
    starterLines,
    supportError,
    supportState,
    toggleLineAdvanced,
    validationErrorsByLine,
  } = useCostSetupForm({
    costItems,
    onReload: reload,
  });

  return (
    <ScreenContainer
      description="Start with the four common gym charges, leave any starter line blank if it does not apply, and add custom rows only when you need them."
      eyebrow="Costs"
      scroll
      title="Track recurring fees and one-time charges.">
      <Card
        subtitle="The active rows in SQLite hydrate into the starter cost form. Inactive rows remain below as history so new setup edits stay focused."
        title="Cost setup overview">
        <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
          {activeCount === 0
            ? 'No active cost rows are saved yet. The starter setup below is ready for membership, signup, annual, and locker costs.'
            : `${activeCount} active cost row${activeCount === 1 ? '' : 's'} are loaded into the setup form. ${inactiveCount} inactive row${inactiveCount === 1 ? '' : 's'} remain in history.`}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={reload}
          style={({ pressed }) => [
            styles.inlineAction,
            {
              marginTop: theme.spacing.lg,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <Text style={[styles.inlineActionLabel, { color: theme.colors.accent }]}>
            Refresh Saved Rows
          </Text>
        </Pressable>
      </Card>

      {loadState === 'loading' ? (
        <Card
          subtitle="The local fee_items query is loading before the starter setup hydrates."
          title="Loading saved costs">
          <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
            Once the read finishes, starter lines fill from active saved rows and the inactive history list becomes available.
          </Text>
        </Card>
      ) : null}

      {loadState === 'error' ? (
        <Card
          subtitle="Retry the local cost query after checking DB bootstrap state."
          title="Cost list needs attention">
          <Text style={[styles.note, { color: theme.colors.danger }]}>
            {loadError ?? 'Unknown cost list query error.'}
          </Text>
        </Card>
      ) : null}

      {loadState === 'ready' ? (
        <CostSetupCard
          appSettings={appSettings}
          customLines={customLines}
          hasPrimaryGym={hasPrimaryGym}
          onAddCustomLine={addCustomLine}
          onRemoveCustomLine={removeCustomLine}
          onSave={async () => {
            await save();
          }}
          onSetLineEnabled={setLineEnabled}
          onSetLineFieldValue={setLineFieldValue}
          onToggleLineAdvanced={toggleLineAdvanced}
          primaryGymName={primaryGym?.name}
          saveFeedback={saveFeedback}
          saveState={saveState}
          starterLines={starterLines}
          supportError={supportError}
          supportState={supportState}
          validationErrorsByLine={validationErrorsByLine}
        />
      ) : null}

      {loadState === 'ready' && inactiveCostItems.length > 0 ? (
        <Card
          subtitle="Inactive rows stay visible for audit history. Reactivating equivalent charges is handled by re-entering them in the setup form."
          title="Inactive cost history">
          <View style={styles.historyList}>
            {inactiveCostItems.map(costItem => (
              <View
                key={costItem.id}
                style={[
                  styles.historyRow,
                  {
                    borderBottomColor: theme.colors.border,
                    paddingBottom: theme.spacing.lg,
                  },
                ]}>
                <Text style={[styles.historyTitle, { color: theme.colors.textPrimary }]}>
                  {costItem.label}
                </Text>
                <Text
                  style={[styles.historyMeta, { color: theme.colors.textSecondary }]}>
                  {`${formatCostItemCategory(costItem.category)} · ${formatCostItemCadence(costItem.cadence)}`}
                </Text>
                <Text style={[styles.historyAmount, { color: theme.colors.textPrimary }]}>
                  {formatCostItemAmount(costItem.amountPreTax)}
                </Text>
                <Text style={[styles.historyMeta, { color: theme.colors.textMuted }]}>
                  {formatCostItemDateRange(costItem)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 8,
  },
  historyList: {
    gap: 16,
  },
  historyMeta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  historyRow: {
    borderBottomWidth: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 15,
    lineHeight: 22,
  },
});
