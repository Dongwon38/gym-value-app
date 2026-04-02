import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { useAppSettingsForm } from '../hooks/useAppSettingsForm';

export function AppSettingsSection() {
  const theme = useAppTheme();
  const {
    errors,
    formValues,
    hasReviewed,
    loadError,
    loadState,
    reload,
    save,
    saveFeedback,
    saveState,
    settings,
    setFieldValue,
  } = useAppSettingsForm();

  if (loadState === 'loading') {
    return (
      <Card
        subtitle="The app is loading the default locale, currency, and tax settings row."
        title="Settings are loading">
        <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>
          This row is seeded during DB bootstrap and reused on every app launch.
        </Text>
      </Card>
    );
  }

  if (loadState === 'error') {
    return (
      <Card
        subtitle="Retry the default settings query after checking local DB bootstrap state."
        title="Couldn't load app settings">
        <Text style={[styles.copy, { color: theme.colors.danger }]}>
          {loadError}
        </Text>
        <PrimaryButton
          label="Retry Settings Load"
          onPress={reload}
          style={{ marginTop: theme.spacing.lg }}
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        subtitle="These defaults power fee item tax inheritance and the app-wide locale baseline."
        title="Default app settings">
        <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>
          {settings?.regionPreset
            ? `Current region preset: ${settings.regionPreset}. v0.1 edits currency, locale, GST, and PST only.`
            : 'No region preset is stored. v0.1 edits currency, locale, GST, and PST only.'}
        </Text>
      </Card>

      <Card
        subtitle="Edit the seeded default row in place. Values persist across app restarts."
        title="Tax and locale defaults">
        <View style={styles.form}>
          <TextField
            autoCapitalize="characters"
            errorMessage={findFieldMessage(errors, 'currency')}
            helperText="Use a short currency code such as CAD."
            label="Currency"
            onChangeText={value => {
              setFieldValue('currency', value);
            }}
            placeholder="CAD"
            value={formValues.currency}
          />
          <TextField
            autoCapitalize="none"
            errorMessage={findFieldMessage(errors, 'locale')}
            helperText="Use a locale such as en-CA."
            label="Locale"
            onChangeText={value => {
              setFieldValue('locale', value);
            }}
            placeholder="en-CA"
            value={formValues.locale}
          />
          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <TextField
                autoCapitalize="none"
                errorMessage={findFieldMessage(errors, 'defaultGstRate')}
                helperText="Decimal rate, for example 0.05"
                keyboardType="decimal-pad"
                label="Default GST"
                onChangeText={value => {
                  setFieldValue('defaultGstRate', value);
                }}
                placeholder="0.05"
                value={formValues.defaultGstRate}
              />
            </View>
            <View style={styles.inlineField}>
              <TextField
                autoCapitalize="none"
                errorMessage={findFieldMessage(errors, 'defaultPstRate')}
                helperText="Decimal rate, for example 0.07"
                keyboardType="decimal-pad"
                label="Default PST"
                onChangeText={value => {
                  setFieldValue('defaultPstRate', value);
                }}
                placeholder="0.07"
                value={formValues.defaultPstRate}
              />
            </View>
          </View>
        </View>

        <PrimaryButton
          disabled={saveState === 'saving'}
          label={saveState === 'saving' ? 'Saving Settings...' : 'Save App Settings'}
          onPress={() => {
            save();
          }}
          style={{ marginTop: theme.spacing.xl }}
        />

        {!hasReviewed ? (
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Save to confirm the default row loads, validates, and upserts correctly.
          </Text>
        ) : null}
        {saveFeedback ? (
          <Text
            style={[
              styles.feedback,
              {
                color:
                  saveState === 'error'
                    ? theme.colors.danger
                    : theme.colors.accent,
              },
            ]}>
            {saveFeedback}
          </Text>
        ) : null}
      </Card>
    </>
  );
}

function findFieldMessage(
  issues: Array<{ field: string; message: string }>,
  field: string,
) {
  return issues.find(issue => issue.field === field)?.message;
}

const styles = StyleSheet.create({
  copy: {
    fontSize: 15,
    lineHeight: 22,
  },
  feedback: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
  form: {
    gap: 16,
  },
  inlineField: {
    flex: 1,
    minWidth: 0,
  },
  inlineFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
});
