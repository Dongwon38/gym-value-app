import React from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { cn } from './cn';
import { Text } from './Text';

type SegmentedOption<Value extends string> = {
  label: string;
  value: Value;
};

type SegmentedControlProps<Value extends string> = {
  className?: string;
  onChange: (value: Value) => void;
  options: Array<SegmentedOption<Value>>;
  value: Value;
};

export function SegmentedControl<Value extends string>({
  className,
  onChange,
  options,
  value,
}: SegmentedControlProps<Value>) {
  const [width, setWidth] = React.useState(0);
  const indicatorOffset = useSharedValue(0);
  const selectedIndex = Math.max(
    options.findIndex(option => option.value === value),
    0,
  );
  const segmentWidth = width > 0 ? width / options.length : 0;

  React.useEffect(() => {
    indicatorOffset.value = withTiming(segmentWidth * selectedIndex, {
      duration: 180,
    });
  }, [indicatorOffset, segmentWidth, selectedIndex]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorOffset.value }],
  }));

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      className={cn(
        'relative flex-row rounded-full border border-border/70 bg-muted-card p-1',
        className,
      )}
      onLayout={handleLayout}>
      {segmentWidth > 0 ? (
        <Animated.View
          className="absolute bottom-1 left-1 top-1 rounded-full bg-card"
          style={[{ width: segmentWidth - 4 }, animatedIndicatorStyle]}
        />
      ) : null}
      {options.map(option => {
        const isSelected = option.value === value;

        return (
          <Pressable
            key={option.value}
            className="flex-1 items-center justify-center rounded-full px-4 py-2.5 active:opacity-90"
            onPress={() => {
              onChange(option.value);
            }}>
            <Text
              className={cn(isSelected ? 'text-foreground' : 'text-secondary-foreground')}
              variant="bodyMuted">
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
