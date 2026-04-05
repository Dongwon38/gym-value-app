import React from 'react';
import type { PressableProps } from 'react-native';

import { Button } from './Button';

type IconButtonProps = Omit<PressableProps, 'style'> & {
  accessibilityLabel: string;
  children: React.ReactNode;
  className?: string;
};

export function IconButton({
  accessibilityLabel,
  children,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      className={className}
      variant="icon-only"
      {...props}>
      {children}
    </Button>
  );
}
