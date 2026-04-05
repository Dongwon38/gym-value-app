import React from 'react';
import type { ViewStyle } from 'react-native';

import { Button } from '../Button';

type PrimaryButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

export function PrimaryButton({
  disabled,
  label,
  onPress,
  style,
}: PrimaryButtonProps) {
  return (
    <Button
      disabled={disabled}
      label={label}
      onPress={onPress}
      style={style}
      variant="primary"
    />
  );
}
