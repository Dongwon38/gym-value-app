import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CostItemEditorCard } from '../../features/costs/components/CostItemEditorCard';
import { useCostItemForm } from '../../features/costs/hooks/useCostItemForm';
import { useCostItems } from '../../features/costs/hooks/useCostItems';
import {
  formatCostItemAmount,
  formatCostItemCadence,
  formatCostItemCategory,
  formatCostItemDateRange,
} from '../../features/costs/useCases/costItems';
import {
  Card,
  EmptyState,
  PrimaryButton,
  ScreenContainer,
} from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

export function CostsScreen() {
  const theme = useAppTheme();
  const { activeCount, costItems, inactiveCount, loadError, loadState, reload } =
    useCostItems();
  const {
    closeEditor,
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
  } = useCostItemForm();

  const totalCount = costItems.length;

  return (
    <ScreenContainer
      description="Recurring membership fees, annual charges, and add-on costs now load from SQLite and can be created or edited from this screen."
      eyebrow="Costs"
      scroll
      title="Track recurring fees and one-time charges.">
      <Card
        subtitle="Read path, add/edit form wiring, and refresh are live. COST-03 will add the dedicated inactive/delete action to the same rows."
        title="Cost list overview">
        <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
          {totalCount === 0
            ? 'No saved cost items yet. Open the editor below to create the first cost line for your primary gym.'
            : `${totalCount} saved cost item${totalCount === 1 ? '' : 's'} loaded. ${activeCount} active and ${inactiveCount} inactive.`}
        </Text>
        <View style={[styles.actions, { marginTop: theme.spacing.lg }]}>
          <PrimaryButton
            label="Add Cost Item"
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
        <CostItemEditorCard
          editorMode={editorMode}
          formValues={formValues}
          hasPrimaryGym={hasPrimaryGym}
          onClose={closeEditor}
          onSave={async () => {
            const savedCostItem = await save();

            if (savedCostItem) {
              reload();
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
          subtitle="The cost list query is reading saved fee items from the local SQLite store."
          title="Loading saved costs">
          <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
            Once the query resolves, this screen switches between the empty state
            and active-first list rows automatically.
          </Text>
        </Card>
      ) : null}

      {loadState === 'error' ? (
        <Card
          subtitle="Retry the read path after checking the local DB bootstrap state."
          title="Cost list needs attention">
          <Text style={[styles.note, { color: theme.colors.danger }]}>
            {loadError ?? 'Unknown cost list query error.'}
          </Text>
          <PrimaryButton
            label="Retry Cost Load"
            onPress={() => {
              reload();
            }}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      ) : null}

      {loadState === 'ready' && costItems.length === 0 ? (
        <EmptyState
          actionLabel="Add Cost Item"
          body="Add your membership cost to start calculating value. This screen now saves one-time, monthly, and annual fee items to SQLite."
          onActionPress={() => {
            startCreate();
          }}
          title="No cost items saved yet"
        />
      ) : null}

      {loadState === 'ready' && costItems.length > 0
        ? costItems.map(costItem => (
            <Card
              key={costItem.id}
              subtitle={`${formatCostItemCategory(costItem.category)} · ${formatCostItemCadence(costItem.cadence)}`}
              title={costItem.label}>
              <View style={styles.rowHeader}>
                <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
                  {formatCostItemAmount(costItem.amountPreTax)}
                </Text>
                <Text
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: costItem.isActive
                        ? theme.colors.surfaceMuted
                        : theme.colors.border,
                      color: costItem.isActive
                        ? theme.colors.accent
                        : theme.colors.textMuted,
                    },
                  ]}>
                  {costItem.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                {formatCostItemDateRange(costItem)}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                {costItem.taxMode === 'inherit_default'
                  ? 'Tax: using default GST/PST.'
                  : 'Tax: custom GST/PST override.'}
              </Text>
              <View style={[styles.actions, { marginTop: theme.spacing.lg }]}>
                <PrimaryButton
                  label="Edit Cost Item"
                  onPress={() => {
                    startEdit(costItem);
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
