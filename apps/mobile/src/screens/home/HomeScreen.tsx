import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MainTabParamList } from '../../app/navigation/navigationTypes';
import { useHomeDashboard } from '../../features/home/hooks/useHomeDashboard';
import {
  formatDashboardCurrency,
  formatDashboardHours,
  formatDashboardMonthVisits,
  formatDashboardVisitLength,
  formatElapsedVisitTime,
  formatLatestVisitAt,
} from '../../features/home/useCases/presentation';
import { Card, EmptyState, PrimaryButton, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

export function HomeScreen() {
  const theme = useAppTheme();
  const isFocused = useIsFocused();
  const previousFocusRef = React.useRef<boolean | null>(null);
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { loadError, loadState, reload, snapshot } = useHomeDashboard();

  React.useEffect(() => {
    if (previousFocusRef.current === null) {
      previousFocusRef.current = isFocused;
      return;
    }

    const wasFocused = previousFocusRef.current;
    previousFocusRef.current = isFocused;

    if (!wasFocused && isFocused) {
      reload();
    }
  }, [isFocused, reload]);

  return (
    <ScreenContainer
      eyebrow="Home"
      scroll
      showEyebrow={false}
      title="Gym Value">
      {loadState === 'loading' ? (
        <>
          <Card title="Loading dashboard">
            <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
              Building your current KPI snapshot.
            </Text>
          </Card>
          <View style={styles.summaryGrid}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`home_loading_${index}`} style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: theme.colors.textMuted }]}>
                  --
                </Text>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      {loadState === 'error' ? (
        <Card title="Dashboard needs attention">
          <Text style={[styles.supportText, { color: theme.colors.danger }]}>
            {loadError ?? 'Unknown home dashboard query error.'}
          </Text>
          <PrimaryButton
            label="Retry"
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
              body="Set up your primary gym to unlock Home metrics and scoped tracking."
              onActionPress={() => {
                navigation.navigate('Settings');
              }}
              title="Set up your primary gym"
            />
          ) : (
            <>
              <Card style={styles.heroCard}>
                <Text style={[styles.heroEyebrow, { color: theme.colors.textMuted }]}>
                  Your gym value
                </Text>
                <Text style={[styles.heroValue, { color: theme.colors.textPrimary }]}>
                  {snapshot.dashboardStats.costPerVisit === null
                    ? getHomeHeroFallback(snapshot)
                    : formatDashboardCurrency(
                        snapshot.dashboardStats.costPerVisit,
                        snapshot.settings,
                      )}
                </Text>
                <Text style={[styles.heroSupport, { color: theme.colors.textSecondary }]}>
                  {snapshot.dashboardStats.costPerVisit === null
                    ? getHomeHeroSupport(snapshot)
                    : 'per visit'}
                </Text>
              </Card>

              <View style={styles.summaryGrid}>
                <MetricCard
                  label="Visits YTD"
                  variant="summary"
                  value={String(snapshot.dashboardStats.totalVisits)}
                />
                <MetricCard
                  label="Total hours"
                  variant="summary"
                  value={formatDashboardHours(snapshot.dashboardStats.totalDurationHours)}
                />
                <MetricCard
                  label="Total spent"
                  variant="summary"
                  value={
                    snapshot.dashboardStats.totalPaid === null
                      ? '--'
                      : formatDashboardCurrency(
                          snapshot.dashboardStats.totalPaid,
                          snapshot.settings,
                        )
                  }
                />
              </View>

              {snapshot.activeVisit ? (
                <Card style={styles.activeVisitCard}>
                  <View style={styles.activeVisitHeader}>
                    <View style={styles.activeVisitTitleBlock}>
                      <Text style={[styles.activeVisitStatus, { color: theme.colors.accent }]}>
                        Active Visit
                      </Text>
                      <Text style={[styles.activeVisitGym, { color: theme.colors.textPrimary }]}>
                        {snapshot.primaryGym.name}
                      </Text>
                    </View>
                    <Text style={[styles.activeVisitTime, { color: theme.colors.textMuted }]}>
                      {formatElapsedVisitTime(snapshot.activeVisit.startedAt)}
                    </Text>
                  </View>
                  <View style={styles.activeVisitFooter}>
                    <Text style={[styles.activeVisitElapsed, { color: theme.colors.accent }]}>
                      {formatElapsedVisitTime(snapshot.activeVisit.startedAt)}
                    </Text>
                    <PrimaryButton
                      label="Open Visits"
                      onPress={() => {
                        navigation.navigate('Visits');
                      }}
                    />
                  </View>
                </Card>
              ) : null}

              <View style={styles.quickActionRow}>
                <QuickAction
                  label={snapshot.activeVisit ? 'Visits' : 'Add Visit'}
                  onPress={() => {
                    navigation.navigate('Visits');
                  }}
                />
                <QuickAction
                  label="Costs"
                  onPress={() => {
                    navigation.navigate('Costs');
                  }}
                />
              </View>

              {snapshot.activeFeeItemCount === 0 ? (
                <Card title="No active costs yet">
                  <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
                    Add at least one active cost item to unlock cost per visit and total paid.
                  </Text>
                  <PrimaryButton
                    label="Open Costs"
                    onPress={() => {
                      navigation.navigate('Costs');
                    }}
                    style={{ marginTop: theme.spacing.lg }}
                  />
                </Card>
              ) : null}

              {snapshot.activeFeeItemCount > 0 &&
              snapshot.dashboardStats.totalVisits === 0 ? (
                <Card title="No completed visits yet">
                  <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
                    Add your first completed visit to turn payment into visit-based value.
                  </Text>
                  <PrimaryButton
                    label="Open Visits"
                    onPress={() => {
                      navigation.navigate('Visits');
                    }}
                    style={{ marginTop: theme.spacing.lg }}
                  />
                </Card>
              ) : null}

              <View style={styles.secondaryGrid}>
                <MetricCard
                  label="Cost per hour"
                  variant="secondary"
                  value={
                    snapshot.dashboardStats.costPerHour === null
                      ? '--'
                      : formatDashboardCurrency(
                          snapshot.dashboardStats.costPerHour,
                          snapshot.settings,
                        )
                  }
                />
                <MetricCard
                  label="This month"
                  variant="secondary"
                  value={formatDashboardMonthVisits(snapshot.currentMonthVisitCount)}
                />
                <MetricCard
                  label="Avg duration"
                  variant="secondary"
                  value={formatDashboardVisitLength(
                    snapshot.dashboardStats.averageVisitLengthMinutes,
                  )}
                />
                <MetricCard
                  label="Recent visit"
                  variant="secondary"
                  value={formatLatestVisitAt(
                    snapshot.dashboardStats.latestVisitAt,
                    snapshot.settings,
                  )}
                />
              </View>
            </>
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
}

function getHomeHeroFallback(
  snapshot: NonNullable<ReturnType<typeof useHomeDashboard>['snapshot']>,
) {
  if (snapshot.activeFeeItemCount === 0) {
    return 'Add costs';
  }

  if (snapshot.dashboardStats.totalVisits === 0) {
    return 'Add visits';
  }

  return 'Unavailable';
}

function getHomeHeroSupport(
  snapshot: NonNullable<ReturnType<typeof useHomeDashboard>['snapshot']>,
) {
  if (snapshot.activeFeeItemCount === 0) {
    return 'Set up at least one active cost line first.';
  }

  if (snapshot.dashboardStats.totalVisits === 0) {
    return 'Complete a visit to calculate value per visit.';
  }

  return 'Value per visit is unavailable right now.';
}

function MetricCard({
  label,
  variant,
  value,
}: {
  label: string;
  variant: 'secondary' | 'summary';
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <Card
      style={variant === 'summary' ? styles.summaryMetricCard : styles.secondaryMetricCard}>
      <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
    </Card>
  );
}

function QuickAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          opacity: pressed ? 0.82 : 1,
        },
      ]}>
      <Text style={[styles.quickActionLabel, { color: theme.colors.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeVisitCard: {
    paddingBottom: 14,
  },
  activeVisitElapsed: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
  },
  activeVisitFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  activeVisitGym: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: 4,
  },
  activeVisitHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activeVisitStatus: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  activeVisitTime: {
    fontSize: 14,
    lineHeight: 18,
  },
  activeVisitTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  heroSupport: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 4,
  },
  heroValue: {
    fontSize: 46,
    fontWeight: '700',
    lineHeight: 52,
    marginTop: 8,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  quickAction: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  secondaryMetricCard: {
    minHeight: 110,
    width: '48%',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryMetricCard: {
    flex: 1,
    minHeight: 88,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  supportText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
