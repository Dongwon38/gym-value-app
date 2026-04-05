import React from 'react';
import { Switch } from 'react-native';

import { SettingsRow } from './SettingsRow';
import { appTheme } from './theme';

type SwitchRowProps = {
  detail?: string;
  label: string;
  last?: boolean;
  onValueChange: (value: boolean) => void;
  value: boolean;
};

export function SwitchRow({
  detail,
  label,
  last,
  onValueChange,
  value,
}: SwitchRowProps) {
  return (
    <SettingsRow
      detail={detail}
      label={label}
      last={last}
      trailing={
        <Switch
          onValueChange={onValueChange}
          thumbColor={appTheme.colors.card}
          trackColor={{
            false: appTheme.colors.border,
            true: appTheme.colors.success,
          }}
          value={value}
        />
      }
    />
  );
}
