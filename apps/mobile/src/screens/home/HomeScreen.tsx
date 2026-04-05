import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Receipt,
} from 'lucide-react-native';

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
import {
  Button,
  Card,
  EmptyState,
  KpiCard,
  Row,
  Screen,
  StatCard,
  Text,
} from '../../ui';
import { appTheme } from '../../ui/theme';

export function HomeScreen() {
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
    <Screen scroll title="Gym Value">
      {loadState === 'loading' ? (
        <>
          <Card description="Building your current KPI snapshot." title="Loading dashboard" />
          <View className="flex-row gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={`home_loading_${index}`}
                className="flex-1"
                padding="compact"
                shadow="soft">
                <Text tone="tertiary" variant="statValue">
                  --
                </Text>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      {loadState === 'error' ? (
        <Card title="Dashboard needs attention">
          <Text tone="destructive" variant="bodyMuted">
            {loadError ?? 'Unknown home dashboard query error.'}
          </Text>
          <Button className="mt-4 self-start" label="Retry" onPress={reload} />
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
              <Animated.View entering={FadeInDown.delay(30).duration(220)}>
                <KpiCard
                  eyebrow="Your gym value"
                  helper={
                    snapshot.dashboardStats.costPerVisit === null
                      ? getHomeHeroSupport(snapshot)
                      : 'per visit'
                  }
                  value={
                    snapshot.dashboardStats.costPerVisit === null
                      ? getHomeHeroFallback(snapshot)
                      : formatDashboardCurrency(
                          snapshot.dashboardStats.costPerVisit,
                          snapshot.settings,
                        )
                  }
                />
              </Animated.View>

              <Animated.View
                className="flex-row gap-3"
                entering={FadeInDown.delay(80).duration(220)}>
                <StatCard
                  icon={
                    <CalendarDays
                      color={appTheme.colors.iconDefault}
                      size={18}
                      strokeWidth={2}
                    />
                  }
                  label="Visits YTD"
                  value={String(snapshot.dashboardStats.totalVisits)}
                />
                <StatCard
                  icon={
                    <Clock3
                      color={appTheme.colors.iconDefault}
                      size={18}
                      strokeWidth={2}
                    />
                  }
                  label="Total hours"
                  value={formatDashboardHours(snapshot.dashboardStats.totalDurationHours)}
                />
                <StatCard
                  icon={
                    <Receipt
                      color={appTheme.colors.iconDefault}
                      size={18}
                      strokeWidth={2}
                    />
                  }
                  label="Total spent"
                  value={
                    snapshot.dashboardStats.totalPaid === null
                      ? '--'
                      : formatDashboardCurrency(
                          snapshot.dashboardStats.totalPaid,
                          snapshot.settings,
                        )
                  }
                />
              </Animated.View>

              {snapshot.activeVisit ? (
                <Animated.View entering={FadeInDown.delay(110).duration(220)}>
                  <Card shadow="soft">
                    <View className="gap-4">
                      <Row justify="between">
                        <Row className="gap-2">
                          <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-success" />
                          <Text tone="success" variant="listMeta">
                            Active Visit
                          </Text>
                        </Row>
                        <Text tone="secondary" variant="listMeta">
                          {formatElapsedVisitTime(snapshot.activeVisit.startedAt)}
                        </Text>
                      </Row>

                      <View className="gap-3">
                        <Row className="gap-2">
                          <MapPin
                            color={appTheme.colors.iconMuted}
                            size={16}
                            strokeWidth={2}
                          />
                          <Text variant="listTitle">{snapshot.primaryGym.name}</Text>
                        </Row>
                        <Row justify="between">
                          <Text className="flex-1" tone="success" variant="statValue">
                            {formatElapsedVisitTime(snapshot.activeVisit.startedAt)}
                          </Text>
                          <Button
                            label="Open Visits"
                            onPress={() => {
                              navigation.navigate('Visits');
                            }}
                            variant="secondary"
                          />
                        </Row>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              ) : null}

              <Animated.View
                className="flex-row gap-3"
                entering={FadeInDown.delay(140).duration(220)}>
                <Button
                  className="flex-1"
                  label="Open Visits"
                  onPress={() => {
                    navigation.navigate('Visits');
                  }}
                  variant="subtleAccent"
                />
                <Button
                  className="flex-1"
                  label="Open Costs"
                  onPress={() => {
                    navigation.navigate('Costs');
                  }}
                  variant="secondary"
                />
              </Animated.View>

              {snapshot.activeFeeItemCount === 0 ? (
                <Card title="No active costs yet">
                  <Text tone="secondary" variant="bodyMuted">
                    Add at least one active cost item to unlock cost per visit and total paid.
                  </Text>
                  <Button
                    className="mt-4 self-start"
                    label="Open Costs"
                    onPress={() => {
                      navigation.navigate('Costs');
                    }}
                  />
                </Card>
              ) : null}

              {snapshot.activeFeeItemCount > 0 &&
              snapshot.dashboardStats.totalVisits === 0 ? (
                <Card title="No completed visits yet">
                  <Text tone="secondary" variant="bodyMuted">
                    Add your first completed visit to turn payment into visit-based value.
                  </Text>
                  <Button
                    className="mt-4 self-start"
                    label="Open Visits"
                    onPress={() => {
                      navigation.navigate('Visits');
                    }}
                  />
                </Card>
              ) : null}

              <Animated.View
                className="flex-row flex-wrap gap-3"
                entering={FadeInDown.delay(170).duration(220)}>
                <QuietSummaryCard
                  label="Cost per hour"
                  value={
                    snapshot.dashboardStats.costPerHour === null
                      ? '--'
                      : formatDashboardCurrency(
                          snapshot.dashboardStats.costPerHour,
                          snapshot.settings,
                        )
                  }
                />
                <QuietSummaryCard
                  label="This month"
                  value={formatDashboardMonthVisits(snapshot.currentMonthVisitCount)}
                />
                <QuietSummaryCard
                  label="Avg duration"
                  value={formatDashboardVisitLength(
                    snapshot.dashboardStats.averageVisitLengthMinutes,
                  )}
                />
                <QuietSummaryCard
                  label="Recent visit"
                  value={formatLatestVisitAt(
                    snapshot.dashboardStats.latestVisitAt,
                    snapshot.settings,
                  )}
                />
              </Animated.View>
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}

function QuietSummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="min-w-[48%] flex-1" padding="compact" shadow="soft">
      <View className="gap-1.5">
        <Text variant="sectionLabel">{label}</Text>
        <Text variant="listTitle">{value}</Text>
      </View>
    </Card>
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

  return '--';
}

function getHomeHeroSupport(
  snapshot: NonNullable<ReturnType<typeof useHomeDashboard>['snapshot']>,
) {
  if (snapshot.activeFeeItemCount === 0) {
    return 'Start by saving your recurring gym costs.';
  }

  if (snapshot.dashboardStats.totalVisits === 0) {
    return 'Visits will unlock your value per visit.';
  }

  return 'per visit';
}
