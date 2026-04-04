import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { useAppTheme } from '../theme';

type TextFieldProps = Omit<TextInputProps, 'onChangeText' | 'value'> & {
  dense?: boolean;
  errorMessage?: string;
  helperText?: string;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
};

export function TextField({
  dense = false,
  errorMessage,
  helperText,
  label,
  onChangeText,
  value,
  ...textInputProps
}: TextFieldProps) {
  const theme = useAppTheme();
  const toneColor = errorMessage ? theme.colors.danger : theme.colors.textMuted;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
        {label}
      </Text>
      <TextInput
        blurOnSubmit={false}
        onChangeText={onChangeText}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: errorMessage ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.sm,
            color: theme.colors.textPrimary,
            paddingHorizontal: dense ? theme.spacing.md : theme.spacing.lg,
            paddingVertical: dense ? theme.spacing.sm + 2 : theme.spacing.md,
          },
        ]}
        value={value}
        {...textInputProps}
      />
      {helperText || errorMessage ? (
        <Text style={[styles.meta, { color: toneColor }]}>
          {errorMessage ?? helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
  },
});
