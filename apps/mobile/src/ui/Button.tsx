import React from 'react';
import type { PressableProps, ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';

import { cn } from './cn';
import { Text } from './Text';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'subtleAccent'
  | 'icon-only';

type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'style'> & {
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  label?: string;
  leadingIcon?: React.ReactNode;
  size?: ButtonSize;
  style?: ViewStyle;
  textClassName?: string;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-success active:bg-success',
  secondary: 'bg-card border border-border/80 active:bg-muted-card',
  ghost: 'bg-transparent active:bg-muted-card',
  destructive: 'bg-destructive active:bg-destructive',
  subtleAccent: 'bg-success-soft border border-success/20 active:bg-success-soft',
  'icon-only': 'bg-success active:bg-success p-0',
};

const textToneClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-foreground',
  ghost: 'text-secondary-foreground',
  destructive: 'text-white',
  subtleAccent: 'text-success',
  'icon-only': 'text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4',
  md: 'min-h-12 px-5',
  lg: 'min-h-14 px-6',
};

export function Button({
  className,
  disabled = false,
  fullWidth = false,
  label,
  leadingIcon,
  size = 'md',
  style,
  textClassName,
  variant = 'primary',
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-full',
        variantClasses[variant],
        variant === 'icon-only' ? 'h-12 w-12' : sizeClasses[size],
        fullWidth ? 'self-stretch' : '',
        disabled ? 'bg-disabled-bg border-disabled-bg active:bg-disabled-bg' : '',
        className,
      )}
      disabled={disabled}
      style={style}
      {...props}>
      {leadingIcon ? <View>{leadingIcon}</View> : null}
      {variant !== 'icon-only' ? (
        <Text
          className={cn(
            disabled ? 'text-disabled-fg' : textToneClasses[variant],
            textClassName,
          )}
          variant="buttonLabel">
          {label ?? children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
