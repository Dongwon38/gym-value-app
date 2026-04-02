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
  errorMessage?: string;
  helperText?: string;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
};

export function TextField({
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
        onChangeText={onChangeText}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: errorMessage ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.sm,
            color: theme.colors.textPrimary,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
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
    gap: 8,
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
});
