import React from 'react';
import { View } from 'react-native';

import { Card } from './Card';
import { Text } from './Text';

type KpiCardProps = {
  eyebrow: string;
  helper?: string;
  value: string;
};

export function KpiCard({ eyebrow, helper, value }: KpiCardProps) {
  return (
    <Card className="items-center py-7" shadow="soft">
      <View className="items-center gap-2">
        <Text variant="cardEyebrow">{eyebrow}</Text>
        <Text className="text-center" variant="kpiValue">
          {value}
        </Text>
        {helper ? (
          <Text className="text-center" tone="secondary" variant="kpiSuffix">
            {helper}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
