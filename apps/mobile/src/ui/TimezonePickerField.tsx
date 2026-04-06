import { ChevronDown } from 'lucide-react-native';
import React from 'react';
import { FlatList, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getTimeZonePickerOptions,
  timeZoneOptionMatchesQuery,
  type TimeZonePickerOption,
} from '../utils/timeZonePickerOptions';
import { cn } from './cn';
import { Input } from './Input';
import { Text } from './Text';
import { appTheme } from './theme';

function normalizeFilter(raw: string) {
  return raw.trim().toLowerCase();
}

type TimezonePickerFieldProps = {
  className?: string;
  disabled?: boolean;
  errorText?: string;
  label?: string;
  onValueChange: (iana: string) => void;
  value: string;
};

export function TimezonePickerField({
  className,
  disabled = false,
  errorText,
  label = 'Timezone',
  onValueChange,
  value,
}: TimezonePickerFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('');

  const allOptions = React.useMemo(
    () => (open ? getTimeZonePickerOptions(new Date()) : []),
    [open],
  );

  const filteredOptions = React.useMemo(() => {
    const q = normalizeFilter(filter);
    if (!q) {
      return allOptions;
    }
    return allOptions.filter(option => timeZoneOptionMatchesQuery(option, q));
  }, [allOptions, filter]);

  React.useEffect(() => {
    if (!open) {
      setFilter('');
    }
  }, [open]);

  function handleSelect(option: TimeZonePickerOption) {
    onValueChange(option.iana);
    setOpen(false);
  }

  const displayValue = value.trim() || 'Select…';

  return (
    <View className={cn('gap-2', className)}>
      {label ? (
        <Text tone="secondary" variant="inputLabel">
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityHint="Opens a searchable list of time zones."
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        className={cn(
          'min-h-[52px] flex-row items-center justify-between rounded-lg border bg-input px-4',
          errorText ? 'border-destructive/70' : 'border-border/70',
          disabled ? 'opacity-50' : 'active:opacity-90',
        )}
        disabled={disabled}
        onPress={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}>
        <Text
          className="flex-1 py-3 pr-2"
          tone={value.trim() ? 'default' : 'secondary'}
          variant="body">
          {displayValue}
        </Text>
        <ChevronDown color={appTheme.colors.iconMuted} size={20} strokeWidth={2} />
      </Pressable>
      {errorText ? (
        <Text tone="destructive" variant="bodyMuted">
          {errorText}
        </Text>
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={() => {
          setOpen(false);
        }}
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        visible={open}>
        <View
          className="flex-1 bg-background"
          style={{ paddingTop: Math.max(insets.top, 12) }}>
          <View className="border-b border-border/70 px-4 pb-3">
            <RowHeader onClose={() => setOpen(false)} />
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              label="Search"
              onChangeText={setFilter}
              placeholder="City, country, or America/Vancouver…"
              value={filter}
            />
            <Text className="mt-1" variant="bodyMuted">
              {filteredOptions.length} time zone
              {filteredOptions.length === 1 ? '' : 's'}
            </Text>
          </View>
          <FlatList
            data={filteredOptions}
            initialNumToRender={16}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            keyExtractor={item => item.iana}
            maxToRenderPerBatch={24}
            renderItem={({ item }) => (
              <TimezonePickerRow
                onPress={() => {
                  handleSelect(item);
                }}
                option={item}
                selected={item.iana === value.trim()}
              />
            )}
            windowSize={10}
          />
        </View>
      </Modal>
    </View>
  );
}

function RowHeader({ onClose }: { onClose: () => void }) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text variant="listTitle">Choose time zone</Text>
      <Pressable
        accessibilityLabel="Close time zone picker"
        accessibilityRole="button"
        className="rounded-full px-3 py-2 active:bg-muted-card"
        hitSlop={8}
        onPress={onClose}>
        <Text variant="bodyMuted">Done</Text>
      </Pressable>
    </View>
  );
}

function TimezonePickerRow({
  onPress,
  option,
  selected,
}: {
  onPress: () => void;
  option: TimeZonePickerOption;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'border-b border-border/60 px-4 py-3 active:bg-muted-card',
        selected ? 'bg-success-soft' : '',
      )}
      onPress={onPress}>
      <Text variant="listTitle">{option.title}</Text>
      {option.subtitle ? (
        <Text className="mt-1" numberOfLines={2} variant="bodyMuted">
          {option.subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}
