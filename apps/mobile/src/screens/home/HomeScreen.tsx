import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MainTabParamList } from '../../app/navigation/navigationTypes';
import { useHomeDashboard } from '../../features/home/hooks/useHomeDashboard';
import {
  formatDashboardCurrency,
  formatDashboardHours,
  formatDashboardRangeLabel,
  formatDashboardRangeWindow,
  formatDashboardVisitLength,
  formatLatestVisitAt,
} from '../../features/home/useCases/presentation';
import { Card, EmptyState, PrimaryButton, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

export function HomeScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { loadError, loadState, reload, snapshot } = useHomeDashboard();

  return (
    <ScreenContainer
      description="Current year KPI snapshot."
      eyebrow="Home"
      scroll
      title="Dashboard">
      {loadState === 'loading' ? (
        <Card
          subtitle="The Home query is loading primary gym, settings, fee items, and visits before building dashboard stats."
          title="Loading dashboard metrics">
          <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
            As soon as the snapshot resolves, this screen switches into the
            appropriate KPI or empty state automatically.
          </Text>
        </Card>
      ) : null}

      {loadState === 'error' ? (
        <Card
          subtitle="Retry the dashboard query after checking local DB bootstrap and repository state."
          title="Dashboard needs attention">
          <Text style={[styles.note, { color: theme.colors.danger }]}>
            {loadError ?? 'Unknown home dashboard query error.'}
          </Text>
          <PrimaryButton
            label="Retry Dashboard Load"
            onPress={reload}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      ) : null}

      {loadState === 'ready' && snapshot ? (
        <>
          {!snapshot.primaryGym ? (
            <EmptyState
              actionLabel="Open Settings"
              body="Home metrics start once a primary gym exists. Set up your gym first so costs, visits, and dashboard stats can be scoped correctly."
              onActionPress={() => {
                navigation.navigate('Settings');
              }}
              title="Set up your primary gym"
            />
          ) : (
            <>
              <Card
                subtitle={`${formatDashboardRangeLabel(snapshot.range)} · ${formatDashboardRangeWindow(snapshot.range, snapshot.settings)}`}
                title="Cost per visit">
                <Text style={[styles.primaryMetric, { color: theme.colors.textPrimary }]}>
                  {snapshot.dashboardStats.costPerVisit === null
                    ? getPrimaryMetricFallback(snapshot)
                    : formatDashboardCurrency(
                        snapshot.dashboardStats.costPerVisit,
                        snapshot.settings,
                      )}
                </Text>
                <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
                  {snapshot.dashboardStats.costPerVisit === null
                    ? getPrimaryMetricSupport(snapshot)
                    : `${formatDashboardCurrency(snapshot.dashboardStats.totalPaid ?? 0, snapshot.settings)} total paid across ${snapshot.dashboardStats.totalVisits} completed visit${snapshot.dashboardStats.totalVisits === 1 ? '' : 's'}.`}
                </Text>
              </Card>

              {snapshot.dashboardStats.hasActiveVisit ? (
                <Card
                  subtitle="Active visits stay out of completed KPI math until they are finished."
                  title="Active visit in progress">
                  <Text style={[styles.note, { color: theme.colors.textPrimary }]}>
                    A visit is currently active. It will start affecting average
                    visit length and cost-per-visit once it is saved as completed.
                  </Text>
                </Card>
              ) : null}

              {snapshot.activeFeeItemCount === 0 ? (
                <EmptyState
                  actionLabel="Go to Costs"
                  body="Add at least one active cost item before Home can calculate total paid, cost per visit, or cost per hour."
                  onActionPress={() => {
                    navigation.navigate('Costs');
                  }}
                  title="No active cost items yet"
                />
              ) : snapshot.dashboardStats.totalVisits === 0 ? (
                <EmptyState
                  actionLabel="Go to Visits"
                  body={
                    snapshot.totalSavedVisits === 0
                      ? 'Add your first visit to unlock cost per visit and average visit length on Home.'
                      : 'You have saved visits, but none are completed in the current range yet. Complete a visit to unlock KPI math.'
                  }
                  onActionPress={() => {
                    navigation.navigate('Visits');
                  }}
                  title="No completed visits yet"
                />
              ) : (
                <>
                  <Card
                    subtitle="The headline metrics below come from the current year dashboard snapshot."
                    title="Summary metrics">
                    <View style={styles.metricList}>
                      <MetricRow
                        label="Total paid"
                        themeColor={theme.colors.textPrimary}
                        value={
                          snapshot.dashboardStats.totalPaid === null
                            ? 'No active costs'
                            : formatDashboardCurrency(
                                snapshot.dashboardStats.totalPaid,
                                snapshot.settings,
                              )
                        }
                      />
                      <MetricRow
                        label="Cost per hour"
                        themeColor={theme.colors.textPrimary}
                        value={
                          snapshot.dashboardStats.costPerHour === null
                            ? 'No duration yet'
                            : formatDashboardCurrency(
                                snapshot.dashboardStats.costPerHour,
                                snapshot.settings,
                              )
                        }
                      />
                      <MetricRow
                        label="Completed visits"
                        themeColor={theme.colors.textPrimary}
                        value={String(snapshot.dashboardStats.totalVisits)}
                      />
                      <MetricRow
                        label="Average visit length"
                        themeColor={theme.colors.textPrimary}
                        value={formatDashboardVisitLength(
                          snapshot.dashboardStats.averageVisitLengthMinutes,
                        )}
                      />
                      <MetricRow
                        label="Total duration"
                        themeColor={theme.colors.textPrimary}
                        value={formatDashboardHours(
                          snapshot.dashboardStats.totalDurationHours,
                        )}
                      />
                      <MetricRow
                        label="Unique visit days"
                        themeColor={theme.colors.textPrimary}
                        value={String(snapshot.dashboardStats.uniqueVisitDays)}
                      />
                    </View>
                  </Card>

                  <Card
                    subtitle="The latest visit uses started_at as the range inclusion key."
                    title="Latest visit">
                    <Text style={[styles.note, { color: theme.colors.textPrimary }]}>
                      {formatLatestVisitAt(
                        snapshot.dashboardStats.latestVisitAt,
                        snapshot.settings,
                      )}
                    </Text>
                  </Card>
                </>
              )}
            </>
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
}

function getPrimaryMetricFallback(
  snapshot: NonNullable<ReturnType<typeof useHomeDashboard>['snapshot']>,
) {
  if (snapshot.activeFeeItemCount === 0) {
    return 'Add an active cost item first.';
  }

  if (snapshot.dashboardStats.totalVisits === 0) {
    return 'No completed visits yet.';
  }

  return 'Cost per visit unavailable.';
}

function getPrimaryMetricSupport(
  snapshot: NonNullable<ReturnType<typeof useHomeDashboard>['snapshot']>,
) {
  if (snapshot.activeFeeItemCount === 0) {
    return 'Home can only calculate value after at least one active cost line exists.';
  }

  if (snapshot.totalSavedVisits === 0) {
    return 'Create your first visit to start measuring how much each gym session costs.';
  }

  return 'Completed visits are required before the main KPI can divide total paid by visit count.';
}

function MetricRow({
  label,
  themeColor,
  value,
}: {
  label: string;
  themeColor: string;
  value: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLabel, { color: themeColor }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: themeColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metricLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  metricList: {
    gap: 12,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'right',
  },
  note: {
    lineHeight: 22,
  },
  primaryMetric: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
});
