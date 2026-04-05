import React from 'react';
import type { TextInputProps } from 'react-native';

import { Input } from '../Input';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  dense?: boolean;
  errorMessage?: string;
  label?: string;
};

export function TextField({
  dense,
  errorMessage,
  label,
  ...props
}: TextFieldProps) {
  return (
    <Input
      className={dense ? 'min-h-[48px]' : undefined}
      errorText={errorMessage}
      label={label}
      {...props}
    />
  );
}
