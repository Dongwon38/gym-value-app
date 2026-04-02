import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Card, EmptyState, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

export function HomeScreen() {
  const theme = useAppTheme();

  return (
    <ScreenContainer
      description="KPI cards, check-in state, and summary metrics will land on this tab."
      eyebrow="Home"
      title="Your gym value dashboard starts here.">
      <Card
        subtitle="The main KPI card, active visit state, and summary rows will replace this placeholder."
        title="Primary KPI Surface">
        <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
          This tab is now using the shared screen container and card styles from
          the theme layer.
        </Text>
      </Card>
      <EmptyState
        actionLabel="Set Up Home"
        body="As soon as the dashboard queries are ready, this state will turn into metric cards and contextual CTAs."
        title="Home content is not wired yet"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  note: {
    lineHeight: 22,
  },
});
