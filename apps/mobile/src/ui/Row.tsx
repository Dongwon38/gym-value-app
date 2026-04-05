import React from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { cn } from './cn';

type RowProps = ViewProps & {
  align?: 'start' | 'center' | 'end';
  className?: string;
  justify?: 'between' | 'start' | 'center' | 'end';
};

const justifyClasses = {
  between: 'justify-between',
  center: 'justify-center',
  end: 'justify-end',
  start: 'justify-start',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
};

export function Row({
  align = 'center',
  children,
  className,
  justify = 'start',
  ...props
}: RowProps) {
  return (
    <View
      className={cn(
        'flex-row',
        justifyClasses[justify],
        alignClasses[align],
        className,
      )}
      {...props}>
      {children}
    </View>
  );
}
