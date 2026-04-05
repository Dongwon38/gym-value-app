import React from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput, View } from 'react-native';

import { cn } from './cn';
import { Text } from './Text';
import { appTheme } from './theme';

type InputProps = Omit<TextInputProps, 'style'> & {
  className?: string;
  errorText?: string;
  helperText?: string;
  label?: string;
  rightAccessory?: React.ReactNode;
};

export function Input({
  className,
  errorText,
  helperText,
  label,
  rightAccessory,
  ...props
}: InputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View className="gap-2">
      {label ? (
        <Text tone="secondary" variant="inputLabel">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          'min-h-[52px] flex-row items-center rounded-lg border bg-input px-4',
          focused ? 'border-success/70 bg-card' : 'border-border/70',
          errorText ? 'border-destructive/70' : '',
          className,
        )}>
        <TextInput
          className="flex-1 py-3 text-body text-foreground"
          onBlur={event => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          onFocus={event => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          placeholderTextColor={appTheme.colors.textTertiary}
          {...props}
        />
        {rightAccessory ? <View className="ml-3">{rightAccessory}</View> : null}
      </View>
      {errorText ? (
        <Text tone="destructive" variant="bodyMuted">
          {errorText}
        </Text>
      ) : helperText ? (
        <Text tone="secondary" variant="bodyMuted">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
