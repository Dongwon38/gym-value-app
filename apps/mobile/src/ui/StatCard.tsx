import React from 'react';
import { View } from 'react-native';

import { Card } from './Card';
import { Text } from './Text';

type StatCardProps = {
  icon?: React.ReactNode;
  label: string;
  value: string;
};

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="min-h-[108px] flex-1" padding="compact" shadow="soft">
      <View className="gap-3">
        {icon ? <View>{icon}</View> : null}
        <View className="gap-1">
          <Text variant="statValue">{value}</Text>
          <Text tone="secondary" variant="statLabel">
            {label}
          </Text>
        </View>
      </View>
    </Card>
  );
}
