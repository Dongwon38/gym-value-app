import React from 'react';
import { View } from 'react-native';

import { Row } from './Row';
import { Text } from './Text';

type SectionHeaderProps = {
  action?: React.ReactNode;
  label?: string;
  title: string;
};

export function SectionHeader({ action, label, title }: SectionHeaderProps) {
  return (
    <Row align="end" className="mb-3" justify="between">
      <View className="gap-1">
        {label ? <Text variant="sectionLabel">{label}</Text> : null}
        <Text variant="listTitle">{title}</Text>
      </View>
      {action ? <View>{action}</View> : null}
    </Row>
  );
}
