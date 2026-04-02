import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Card, EmptyState, ScreenContainer } from '../../ui/components';
import { useAppTheme } from '../../ui/theme';

export function VisitsScreen() {
  const theme = useAppTheme();

  return (
    <ScreenContainer
      description="The next phase will connect the visits list, add/edit flow, and empty states to this screen."
      eyebrow="Visits"
      title="Manual visit tracking will live here.">
      <Card
        subtitle="Visit list rows, sort state, and edit actions will slot into this common surface."
        title="Visit feed shell">
        <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
          This placeholder is intentionally using the same container and card
          building blocks as the other tabs.
        </Text>
      </Card>
      <EmptyState
        actionLabel="Add Visit Later"
        body="The manual visit flow will reuse this shared empty-state pattern once the data layer lands."
        title="No visits are wired yet"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  note: {
    lineHeight: 22,
  },
});
