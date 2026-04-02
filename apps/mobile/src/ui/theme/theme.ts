import type { TextStyle } from 'react-native';

export const appTheme = {
  colors: {
    background: '#F4F1EA',
    surface: '#FFFCF5',
    surfaceMuted: '#EFE7D9',
    border: '#D9D0C2',
    textPrimary: '#1F1A14',
    textSecondary: '#4C4337',
    textMuted: '#6F6455',
    accent: '#2F6A5E',
    accentPressed: '#25564C',
    accentContrast: '#FFFDF8',
    danger: '#A24438',
    warning: '#8A611D',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    pill: 999,
  },
  typography: {
    eyebrow: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.8,
      lineHeight: 18,
      textTransform: 'uppercase',
    } satisfies TextStyle,
    title: {
      fontSize: 31,
      fontWeight: '700',
      lineHeight: 38,
    } satisfies TextStyle,
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    } satisfies TextStyle,
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    } satisfies TextStyle,
    cardTitle: {
      fontSize: 19,
      fontWeight: '700',
      lineHeight: 24,
    } satisfies TextStyle,
  },
} as const;

export type AppTheme = typeof appTheme;
