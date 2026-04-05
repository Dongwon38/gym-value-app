import type { TextStyle } from 'react-native';

import { tokens } from '../../../design/tokens';

type TypographyVariant = keyof typeof tokens.typography;

function buildTextStyle(variant: TypographyVariant): TextStyle {
  const definition = tokens.typography[variant];

  return {
    fontFamily: tokens.fontFamily.sans,
    fontSize: definition.fontSize,
    fontWeight: definition.fontWeight as TextStyle['fontWeight'],
    letterSpacing: definition.letterSpacing,
    lineHeight: definition.lineHeight,
  };
}

export const appTheme = {
  ...tokens,
  colors: {
    ...tokens.colors,
    accent: tokens.colors.success,
    accentContrast: '#FFFFFF',
    accentPressed: tokens.colors.successPressed,
    danger: tokens.colors.destructive,
    surface: tokens.colors.card,
    surfaceMuted: tokens.colors.mutedCard,
    textMuted: tokens.colors.textTertiary,
  },
  radius: {
    ...tokens.radius,
    pill: tokens.radius.full,
  },
  spacing: {
    ...tokens.spacing,
    xs: tokens.spacing[1],
    sm: tokens.spacing[2],
    md: tokens.spacing[3],
    lg: tokens.spacing[4],
    xl: tokens.spacing[5],
    xxl: tokens.spacing[7],
  },
  typographyStyles: Object.fromEntries(
    Object.keys(tokens.typography).map(key => [
      key,
      buildTextStyle(key as TypographyVariant),
    ]),
  ) as Record<TypographyVariant, TextStyle>,
};

export type AppTheme = typeof appTheme;
