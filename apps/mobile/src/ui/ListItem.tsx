import React from 'react';
import type { PressableProps } from 'react-native';
import { View } from 'react-native';

import { Card } from './Card';
import { Row } from './Row';
import { Text } from './Text';

type ListItemProps = Omit<PressableProps, 'style'> & {
  className?: string;
  leading?: React.ReactNode;
  subtitle?: string;
  title: string;
  trailing?: React.ReactNode;
};

export function ListItem({
  className,
  leading,
  onPress,
  subtitle,
  title,
  trailing,
  ...props
}: ListItemProps) {
  return (
    <Card
      className={className}
      contentClassName="gap-0"
      onPress={onPress}
      padding="compact"
      shadow="soft"
      {...props}>
      <Row align="center" className="gap-3" justify="between">
        <Row align="center" className="flex-1 gap-3">
          {leading ? <View>{leading}</View> : null}
          <View className="flex-1 gap-0.5">
            <Text variant="listTitle">{title}</Text>
            {subtitle ? (
              <Text tone="secondary" variant="listMeta">
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Row>
        {trailing ? <View>{trailing}</View> : null}
      </Row>
    </Card>
  );
}
