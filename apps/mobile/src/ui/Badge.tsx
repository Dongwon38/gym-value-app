import React from 'react';
import { View } from 'react-native';

import { cn } from './cn';
import { Text } from './Text';

type BadgeTone = 'success' | 'warning' | 'destructive' | 'neutral' | 'accent';

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  destructive: 'bg-destructive-soft',
  neutral: 'bg-pill',
  accent: 'bg-success-soft',
};

const textToneClasses: Record<BadgeTone, 'success' | 'warning' | 'destructive' | 'secondary'> =
  {
    success: 'success',
    warning: 'warning',
    destructive: 'destructive',
    neutral: 'secondary',
    accent: 'success',
  };

type BadgeProps = {
  className?: string;
  label: string;
  tone?: BadgeTone;
};

export function Badge({ className, label, tone = 'neutral' }: BadgeProps) {
  return (
    <View className={cn('rounded-full px-3 py-1.5', toneClasses[tone], className)}>
      <Text tone={textToneClasses[tone]} variant="listMeta">
        {label}
      </Text>
    </View>
  );
}
