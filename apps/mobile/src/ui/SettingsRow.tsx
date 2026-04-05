import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { cn } from './cn';
import { Row } from './Row';
import { Text } from './Text';
import { appTheme } from './theme';

type SettingsRowProps = {
  className?: string;
  detail?: string;
  icon?: React.ReactNode;
  last?: boolean;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  value?: string;
};

export function SettingsRow({
  className,
  detail,
  icon,
  label,
  last = false,
  onPress,
  trailing,
  value,
}: SettingsRowProps) {
  const content = (
    <Row
      align="center"
      className={cn(
        'min-h-[56px] gap-3',
        !last ? 'border-b border-border/70' : '',
        className,
      )}
      justify="between">
      <Row align="center" className="flex-1 gap-3">
        {icon ? (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-success-soft">
            {icon}
          </View>
        ) : null}
        <View className="flex-1 gap-0.5">
          <Text variant="body">{label}</Text>
          {detail ? (
            <Text tone="secondary" variant="bodyMuted">
              {detail}
            </Text>
          ) : null}
        </View>
      </Row>
      {trailing ? (
        trailing
      ) : value || onPress ? (
        <Row align="center" className="gap-2">
          {value ? (
            <Text className="max-w-[160px] text-right" tone="secondary" variant="body">
              {value}
            </Text>
          ) : null}
          {onPress ? (
            <ChevronRight color={appTheme.colors.iconMuted} size={18} strokeWidth={2} />
          ) : null}
        </Row>
      ) : null}
    </Row>
  );

  if (onPress) {
    return (
      <Pressable className="active:opacity-80" onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
}
