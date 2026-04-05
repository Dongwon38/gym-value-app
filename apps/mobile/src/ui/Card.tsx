import React from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';

import { cn } from './cn';
import { Text } from './Text';
import { appTheme } from './theme';

type CardVariant = 'default' | 'muted' | 'quiet';
type CardPadding = 'default' | 'compact' | 'none';
type CardShadow = 'card' | 'soft' | 'floating' | 'none';

type SharedCardProps = {
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  description?: string;
  padding?: CardPadding;
  shadow?: CardShadow;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title?: string;
  variant?: CardVariant;
};

type CardProps = SharedCardProps &
  Omit<PressableProps, 'style'> & {
    onPress?: (() => void) | undefined;
  };

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-card border border-border/70',
  muted: 'bg-muted-card border border-border/70',
  quiet: 'bg-card',
};

const paddingClasses: Record<CardPadding, string> = {
  default: 'p-5',
  compact: 'p-4',
  none: '',
};

function getShadowStyle(shadow: CardShadow) {
  if (shadow === 'none') {
    return undefined;
  }

  return appTheme.shadow[shadow];
}

function CardInner({
  children,
  contentClassName,
  description,
  subtitle,
  title,
}: Pick<
  SharedCardProps,
  'children' | 'contentClassName' | 'description' | 'subtitle' | 'title'
>) {
  const resolvedDescription = description ?? subtitle;

  return (
    <View className={cn('gap-3', contentClassName)}>
      {title ? (
        <View className="gap-1">
          <Text variant="listTitle">{title}</Text>
          {resolvedDescription ? (
            <Text tone="secondary" variant="bodyMuted">
              {resolvedDescription}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Card({
  children,
  className,
  contentClassName,
  description,
  onPress,
  padding = 'default',
  shadow = 'card',
  style,
  subtitle,
  title,
  variant = 'default',
  ...props
}: CardProps) {
  const sharedClassName = cn(
    'rounded-xl',
    variantClasses[variant],
    paddingClasses[padding],
    className,
  );

  if (onPress) {
    return (
      <Pressable
        className={cn(sharedClassName, 'active:opacity-90')}
        onPress={onPress}
        style={style ? [getShadowStyle(shadow), style] : getShadowStyle(shadow)}
        {...props}>
        <CardInner
          contentClassName={contentClassName}
          description={description}
          subtitle={subtitle}
          title={title}>
          {children}
        </CardInner>
      </Pressable>
    );
  }

  return (
    <View
      className={sharedClassName}
      style={style ? [getShadowStyle(shadow), style] : getShadowStyle(shadow)}
      {...props}>
      <CardInner
        contentClassName={contentClassName}
        description={description}
        subtitle={subtitle}
        title={title}>
        {children}
      </CardInner>
    </View>
  );
}
