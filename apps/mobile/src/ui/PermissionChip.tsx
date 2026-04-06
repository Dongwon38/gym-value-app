import React from 'react';
import type { PressableProps } from 'react-native';
import { Pressable, View } from 'react-native';

import { cn } from './cn';
import { Text } from './Text';

export type PermissionChipTone =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'neutral';

const toneClasses: Record<PermissionChipTone, string> = {
  success: 'border-success/35 bg-success-soft',
  warning: 'border-warning/40 bg-warning-soft',
  destructive: 'border-destructive/35 bg-destructive-soft',
  neutral: 'border-border/80 bg-muted-card',
};

const statusToneText: Record<PermissionChipTone, 'success' | 'warning' | 'destructive' | 'secondary'> =
  {
    success: 'success',
    warning: 'warning',
    destructive: 'destructive',
    neutral: 'secondary',
  };

type PermissionChipProps = Omit<PressableProps, 'style'> & {
  className?: string;
  /** When true, renders a single-line trailing chip (label lives in SettingsRow). */
  compact?: boolean;
  icon?: React.ReactNode;
  statusLabel: string;
  title?: string;
  tone: PermissionChipTone;
};

export function PermissionChip({
  className,
  compact = false,
  icon,
  statusLabel,
  title,
  tone,
  ...props
}: PermissionChipProps) {
  if (compact) {
    return (
      <Pressable
        accessibilityHint="Opens actions to request access or open system settings."
        accessibilityRole="button"
        className={cn(
          'min-h-10 shrink-0 flex-row items-center justify-center rounded-full border px-3.5 py-2 active:opacity-80',
          toneClasses[tone],
          className,
        )}
        {...props}>
        <Text numberOfLines={1} tone={statusToneText[tone]} variant="listMeta">
          {statusLabel}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityHint="Opens actions to request access or open system settings."
      accessibilityRole="button"
      className={cn(
        'min-h-11 flex-row items-center gap-2 rounded-full border px-3 py-2 active:opacity-80',
        toneClasses[tone],
        className,
      )}
      {...props}>
      {icon ? <View className="shrink-0">{icon}</View> : null}
      <View className="min-w-0 flex-1">
        {title ? (
          <Text numberOfLines={1} variant="listMeta">
            {title}
          </Text>
        ) : null}
        <Text numberOfLines={1} tone={statusToneText[tone]} variant="bodyMuted">
          {statusLabel}
        </Text>
      </View>
    </Pressable>
  );
}
