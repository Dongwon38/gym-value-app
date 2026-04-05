import React from 'react';
import { View } from 'react-native';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

type EmptyStateProps = {
  actionLabel?: string;
  body: string;
  onActionPress?: () => void;
  title: string;
};

export function EmptyState({
  actionLabel,
  body,
  onActionPress,
  title,
}: EmptyStateProps) {
  return (
    <Card className="gap-3" shadow="soft">
      <View className="gap-2">
        <Text variant="listTitle">{title}</Text>
        <Text tone="secondary" variant="bodyMuted">
          {body}
        </Text>
      </View>
      {actionLabel && onActionPress ? (
        <Button className="self-start" label={actionLabel} onPress={onActionPress} />
      ) : null}
    </Card>
  );
}
