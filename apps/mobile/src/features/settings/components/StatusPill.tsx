import React from 'react';

import { Badge } from '../../../ui';

type StatusPillProps = {
  label: string;
  tone?: 'accent' | 'danger' | 'neutral' | 'success' | 'warning';
};

const badgeToneMap = {
  accent: 'accent',
  danger: 'destructive',
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
} as const;

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  return <Badge label={label} tone={badgeToneMap[tone]} />;
}
