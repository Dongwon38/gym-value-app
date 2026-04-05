import React from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';
import { Text as RNText } from 'react-native';

import { cn } from './cn';

export type TextVariant =
  | 'screenTitle'
  | 'sectionLabel'
  | 'cardEyebrow'
  | 'kpiValue'
  | 'kpiSuffix'
  | 'statValue'
  | 'statLabel'
  | 'body'
  | 'bodyMuted'
  | 'listTitle'
  | 'listMeta'
  | 'buttonLabel'
  | 'inputLabel'
  | 'tabLabel';

type TextTone =
  | 'default'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'destructive'
  | 'warning'
  | 'inverse';

const variantClasses: Record<TextVariant, string> = {
  screenTitle: 'text-screen-title font-bold text-foreground',
  sectionLabel:
    'text-section-label font-bold uppercase tracking-[1.1px] text-tertiary-foreground',
  cardEyebrow:
    'text-card-eyebrow font-bold uppercase tracking-[1px] text-tertiary-foreground',
  kpiValue: 'text-kpi-value font-bold text-foreground',
  kpiSuffix: 'text-kpi-suffix font-medium text-secondary-foreground',
  statValue: 'text-stat-value font-bold text-foreground',
  statLabel: 'text-stat-label font-medium text-secondary-foreground',
  body: 'text-body text-foreground',
  bodyMuted: 'text-body-muted text-secondary-foreground',
  listTitle: 'text-list-title font-semibold text-foreground',
  listMeta: 'text-list-meta font-medium text-secondary-foreground',
  buttonLabel: 'text-button-label font-semibold text-foreground',
  inputLabel: 'text-input-label font-semibold text-secondary-foreground',
  tabLabel: 'text-tab-label font-semibold text-tab-inactive',
};

const toneClasses: Record<TextTone, string> = {
  default: 'text-foreground',
  secondary: 'text-secondary-foreground',
  tertiary: 'text-tertiary-foreground',
  success: 'text-success',
  destructive: 'text-destructive',
  warning: 'text-warning',
  inverse: 'text-white',
};

type AppTextProps = TextProps & {
  className?: string;
  style?: StyleProp<TextStyle>;
  tone?: TextTone;
  variant?: TextVariant;
};

export function Text({
  children,
  className,
  style,
  tone,
  variant = 'body',
  ...props
}: AppTextProps) {
  return (
    <RNText
      className={cn(variantClasses[variant], tone ? toneClasses[tone] : null, className)}
      style={style}
      {...props}>
      {children}
    </RNText>
  );
}
