const { tokens } = require('./design/tokens');

module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.js',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: tokens.colors.background,
        card: tokens.colors.card,
        'muted-card': tokens.colors.mutedCard,
        border: tokens.colors.border,
        foreground: tokens.colors.textPrimary,
        'secondary-foreground': tokens.colors.textSecondary,
        'tertiary-foreground': tokens.colors.textTertiary,
        success: tokens.colors.success,
        'success-soft': tokens.colors.successSoft,
        destructive: tokens.colors.destructive,
        'destructive-soft': tokens.colors.destructiveSoft,
        warning: tokens.colors.warning,
        'warning-soft': tokens.colors.warningSoft,
        pill: tokens.colors.pill,
        input: tokens.colors.input,
        overlay: tokens.colors.overlay,
        'disabled-bg': tokens.colors.disabledBackground,
        'disabled-fg': tokens.colors.disabledText,
        'icon-default': tokens.colors.iconDefault,
        'icon-muted': tokens.colors.iconMuted,
        'tab-active': tokens.colors.tabActive,
        'tab-inactive': tokens.colors.tabInactive,
      },
      spacing: Object.fromEntries(
        Object.entries(tokens.spacing).map(([key, value]) => [key, `${value}px`]),
      ),
      borderRadius: Object.fromEntries(
        Object.entries(tokens.radius).map(([key, value]) => [key, `${value}px`]),
      ),
      fontFamily: {
        sans: [tokens.fontFamily.sans],
      },
      fontSize: {
        'screen-title': [
          `${tokens.typography.screenTitle.fontSize}px`,
          {
            lineHeight: `${tokens.typography.screenTitle.lineHeight}px`,
            letterSpacing: `${tokens.typography.screenTitle.letterSpacing}px`,
            fontWeight: tokens.typography.screenTitle.fontWeight,
          },
        ],
        'section-label': [
          `${tokens.typography.sectionLabel.fontSize}px`,
          {
            lineHeight: `${tokens.typography.sectionLabel.lineHeight}px`,
            letterSpacing: `${tokens.typography.sectionLabel.letterSpacing}px`,
            fontWeight: tokens.typography.sectionLabel.fontWeight,
          },
        ],
        'card-eyebrow': [
          `${tokens.typography.cardEyebrow.fontSize}px`,
          {
            lineHeight: `${tokens.typography.cardEyebrow.lineHeight}px`,
            letterSpacing: `${tokens.typography.cardEyebrow.letterSpacing}px`,
            fontWeight: tokens.typography.cardEyebrow.fontWeight,
          },
        ],
        'kpi-value': [
          `${tokens.typography.kpiValue.fontSize}px`,
          {
            lineHeight: `${tokens.typography.kpiValue.lineHeight}px`,
            letterSpacing: `${tokens.typography.kpiValue.letterSpacing}px`,
            fontWeight: tokens.typography.kpiValue.fontWeight,
          },
        ],
        'kpi-suffix': [
          `${tokens.typography.kpiSuffix.fontSize}px`,
          {
            lineHeight: `${tokens.typography.kpiSuffix.lineHeight}px`,
            letterSpacing: `${tokens.typography.kpiSuffix.letterSpacing}px`,
            fontWeight: tokens.typography.kpiSuffix.fontWeight,
          },
        ],
        'stat-value': [
          `${tokens.typography.statValue.fontSize}px`,
          {
            lineHeight: `${tokens.typography.statValue.lineHeight}px`,
            letterSpacing: `${tokens.typography.statValue.letterSpacing}px`,
            fontWeight: tokens.typography.statValue.fontWeight,
          },
        ],
        'stat-label': [
          `${tokens.typography.statLabel.fontSize}px`,
          {
            lineHeight: `${tokens.typography.statLabel.lineHeight}px`,
            letterSpacing: `${tokens.typography.statLabel.letterSpacing}px`,
            fontWeight: tokens.typography.statLabel.fontWeight,
          },
        ],
        body: [
          `${tokens.typography.body.fontSize}px`,
          {
            lineHeight: `${tokens.typography.body.lineHeight}px`,
            letterSpacing: `${tokens.typography.body.letterSpacing}px`,
            fontWeight: tokens.typography.body.fontWeight,
          },
        ],
        'body-muted': [
          `${tokens.typography.bodyMuted.fontSize}px`,
          {
            lineHeight: `${tokens.typography.bodyMuted.lineHeight}px`,
            letterSpacing: `${tokens.typography.bodyMuted.letterSpacing}px`,
            fontWeight: tokens.typography.bodyMuted.fontWeight,
          },
        ],
        'list-title': [
          `${tokens.typography.listTitle.fontSize}px`,
          {
            lineHeight: `${tokens.typography.listTitle.lineHeight}px`,
            letterSpacing: `${tokens.typography.listTitle.letterSpacing}px`,
            fontWeight: tokens.typography.listTitle.fontWeight,
          },
        ],
        'list-meta': [
          `${tokens.typography.listMeta.fontSize}px`,
          {
            lineHeight: `${tokens.typography.listMeta.lineHeight}px`,
            letterSpacing: `${tokens.typography.listMeta.letterSpacing}px`,
            fontWeight: tokens.typography.listMeta.fontWeight,
          },
        ],
        'button-label': [
          `${tokens.typography.buttonLabel.fontSize}px`,
          {
            lineHeight: `${tokens.typography.buttonLabel.lineHeight}px`,
            letterSpacing: `${tokens.typography.buttonLabel.letterSpacing}px`,
            fontWeight: tokens.typography.buttonLabel.fontWeight,
          },
        ],
        'input-label': [
          `${tokens.typography.inputLabel.fontSize}px`,
          {
            lineHeight: `${tokens.typography.inputLabel.lineHeight}px`,
            letterSpacing: `${tokens.typography.inputLabel.letterSpacing}px`,
            fontWeight: tokens.typography.inputLabel.fontWeight,
          },
        ],
        'tab-label': [
          `${tokens.typography.tabLabel.fontSize}px`,
          {
            lineHeight: `${tokens.typography.tabLabel.lineHeight}px`,
            letterSpacing: `${tokens.typography.tabLabel.letterSpacing}px`,
            fontWeight: tokens.typography.tabLabel.fontWeight,
          },
        ],
      },
      boxShadow: {
        card: '0px 8px 18px rgba(31, 41, 55, 0.05)',
        soft: '0px 6px 14px rgba(31, 41, 55, 0.035)',
        floating: '0px 10px 20px rgba(31, 41, 55, 0.08)',
      },
    },
  },
};
