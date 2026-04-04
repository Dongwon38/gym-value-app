import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { BottomSheet, Card, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { useAppSettingsForm } from '../hooks/useAppSettingsForm';
import { SettingsRow } from './SettingsRow';

function findFieldMessage(
  issues: Array<{ field: string; message: string }>,
  field: string,
) {
  return issues.find(issue => issue.field === field)?.message;
}

function formatRatePercentage(value: number | string | undefined) {
  const numericValue =
    typeof value === 'number' ? value : value ? Number(value) : Number.NaN;

  if (Number.isNaN(numericValue)) {
    return '-';
  }

  return `${(numericValue * 100).toFixed(numericValue === 0 ? 0 : 1).replace(/\.0$/, '')}%`;
}

export function AppSettingsSection() {
  const theme = useAppTheme();
  const [editorVisible, setEditorVisible] = React.useState(false);
  const {
    errors,
    formValues,
    loadError,
    loadState,
    reload,
    save,
    saveFeedback,
    saveState,
    settings,
    setFieldValue,
  } = useAppSettingsForm();

  async function handleSave(closeAfterSave = false) {
    const savedSettings = await save();

    if (savedSettings && closeAfterSave) {
      setEditorVisible(false);
    }
  }

  const footer = (
    <View style={styles.footerRow}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setEditorVisible(false);
        }}
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.pill,
            opacity: pressed ? 0.76 : 1,
          },
        ]}>
        <Text style={[styles.secondaryButtonLabel, { color: theme.colors.textSecondary }]}>
          Cancel
        </Text>
      </Pressable>
      <PrimaryButton
        disabled={saveState === 'saving'}
        label={saveState === 'saving' ? 'Saving...' : 'Save Defaults'}
        onPress={() => {
          handleSave(true);
        }}
        style={styles.primaryFooterButton}
      />
    </View>
  );

  if (loadState === 'loading') {
    return (
      <Card title="Settings">
        <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>
          Loading tracking defaults and tax presets.
        </Text>
      </Card>
    );
  }

  if (loadState === 'error') {
    return (
      <Card title="Settings">
        <Text style={[styles.copy, { color: theme.colors.danger }]}>
          {loadError}
        </Text>
        <PrimaryButton
          label="Retry"
          onPress={reload}
          style={{ marginTop: theme.spacing.lg }}
        />
      </Card>
    );
  }

  return (
    <>
      <Card title="Tracking">
        <View>
          <SettingsRow
            detail="Show a prompt when you enter the gym geofence."
            label="Check-in suggestions"
            trailing={
              <Switch
                onValueChange={value => {
                  setFieldValue('checkinSuggestionsEnabled', value);
                }}
                thumbColor={theme.colors.surface}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.accent,
                }}
                value={formValues.checkinSuggestionsEnabled}
              />
            }
          />
          <SettingsRow
            detail="Suggest finishing a visit after you leave."
            label="Check-out suggestions"
            last
            trailing={
              <Switch
                onValueChange={value => {
                  setFieldValue('checkoutSuggestionsEnabled', value);
                }}
                thumbColor={theme.colors.surface}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.accent,
                }}
                value={formValues.checkoutSuggestionsEnabled}
              />
            }
          />
        </View>

        <PrimaryButton
          disabled={saveState === 'saving'}
          label={saveState === 'saving' ? 'Saving...' : 'Save Tracking'}
          onPress={() => {
            handleSave(false);
          }}
          style={{ marginTop: theme.spacing.lg }}
        />

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

      <Card title="Tax defaults">
        <View>
          <SettingsRow label="Currency" value={settings?.currency ?? formValues.currency} />
          <SettingsRow label="Locale" value={settings?.locale ?? formValues.locale} />
          <SettingsRow
            label="GST"
            value={formatRatePercentage(settings?.defaultGstRate ?? formValues.defaultGstRate)}
          />
          <SettingsRow
            label="PST"
            last
            value={formatRatePercentage(settings?.defaultPstRate ?? formValues.defaultPstRate)}
          />
        </View>

        <View style={styles.sectionFooter}>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Region preset {settings?.regionPreset ?? 'BC_CA'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEditorVisible(true);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.76 : 1 }]}>
            <Text style={[styles.inlineAction, { color: theme.colors.accent }]}>
              Edit Defaults
            </Text>
          </Pressable>
        </View>
      </Card>

      <BottomSheet
        footer={footer}
        onClose={() => {
          setEditorVisible(false);
        }}
        subtitle="Currency, locale, and tax defaults"
        title="Edit Defaults"
        visible={editorVisible}>
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

        <TextField
          autoCapitalize="characters"
          errorMessage={findFieldMessage(errors, 'currency')}
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
              keyboardType="decimal-pad"
              label="GST"
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
              keyboardType="decimal-pad"
              label="PST"
              onChangeText={value => {
                setFieldValue('defaultPstRate', value);
              }}
              placeholder="0.07"
              value={formValues.defaultPstRate}
            />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  copy: {
    fontSize: 15,
    lineHeight: 20,
  },
  feedback: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineAction: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  inlineField: {
    flex: 1,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryFooterButton: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
