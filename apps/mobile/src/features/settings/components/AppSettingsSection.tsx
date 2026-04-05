import React from 'react';
import { View } from 'react-native';

import { useAppSettingsForm } from '../hooks/useAppSettingsForm';
import {
  BottomSheetFormShell,
  Button,
  Card,
  Input,
  Row,
  SectionHeader,
  SettingsRow,
  SwitchRow,
  Text,
} from '../../../ui';

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

  if (loadState === 'loading') {
    return <Card description="Loading tracking defaults and tax presets." title="Settings" />;
  }

  if (loadState === 'error') {
    return (
      <Card title="Settings">
        <Text tone="destructive" variant="bodyMuted">
          {loadError}
        </Text>
        <Button className="mt-4 self-start" label="Retry" onPress={reload} />
      </Card>
    );
  }

  return (
    <>
      <View className="gap-3">
        <SectionHeader label="Tracking" title="Suggestions" />
        <Card padding="compact" shadow="soft">
          <SwitchRow
            detail="Show a prompt when you enter the gym geofence."
            label="Check-in suggestions"
            onValueChange={value => {
              setFieldValue('checkinSuggestionsEnabled', value);
            }}
            value={formValues.checkinSuggestionsEnabled}
          />
          <SwitchRow
            detail="Suggest finishing a visit after you leave."
            label="Check-out suggestions"
            last
            onValueChange={value => {
              setFieldValue('checkoutSuggestionsEnabled', value);
            }}
            value={formValues.checkoutSuggestionsEnabled}
          />
        </Card>
        <Button
          className="self-start"
          disabled={saveState === 'saving'}
          label={saveState === 'saving' ? 'Saving...' : 'Save Tracking'}
          onPress={() => {
            handleSave(false);
          }}
          variant="secondary"
        />
      </View>

      <View className="gap-3">
        <SectionHeader label="Tax Defaults" title="Region defaults" />
        <Card padding="compact" shadow="soft">
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
        </Card>
        <Row justify="between">
          <Text tone="secondary" variant="bodyMuted">
            Region preset {settings?.regionPreset ?? 'BC_CA'}
          </Text>
          <Button
            label="Edit Defaults"
            onPress={() => {
              setEditorVisible(true);
            }}
            size="sm"
            variant="ghost"
          />
        </Row>
      </View>

      {saveFeedback ? (
        <Text tone={saveState === 'error' ? 'destructive' : 'success'} variant="bodyMuted">
          {saveFeedback}
        </Text>
      ) : null}

      <BottomSheetFormShell
        footer={
          <Row className="gap-3">
            <Button
              className="flex-1"
              label="Cancel"
              onPress={() => {
                setEditorVisible(false);
              }}
              variant="secondary"
            />
            <Button
              className="flex-1"
              disabled={saveState === 'saving'}
              label={saveState === 'saving' ? 'Saving...' : 'Save Defaults'}
              onPress={() => {
                handleSave(true);
              }}
            />
          </Row>
        }
        onClose={() => {
          setEditorVisible(false);
        }}
        subtitle="Currency, locale, and tax defaults"
        title="Edit Defaults"
        visible={editorVisible}>
        <Input
          autoCapitalize="characters"
          errorText={findFieldMessage(errors, 'currency')}
          label="Currency"
          onChangeText={value => {
            setFieldValue('currency', value);
          }}
          placeholder="CAD"
          value={formValues.currency}
        />
        <Input
          autoCapitalize="none"
          errorText={findFieldMessage(errors, 'locale')}
          label="Locale"
          onChangeText={value => {
            setFieldValue('locale', value);
          }}
          placeholder="en-CA"
          value={formValues.locale}
        />
        <Row align="start" className="gap-3">
          <View className="flex-1">
            <Input
              autoCapitalize="none"
              errorText={findFieldMessage(errors, 'defaultGstRate')}
              keyboardType="decimal-pad"
              label="GST"
              onChangeText={value => {
                setFieldValue('defaultGstRate', value);
              }}
              placeholder="0.05"
              value={formValues.defaultGstRate}
            />
          </View>
          <View className="flex-1">
            <Input
              autoCapitalize="none"
              errorText={findFieldMessage(errors, 'defaultPstRate')}
              keyboardType="decimal-pad"
              label="PST"
              onChangeText={value => {
                setFieldValue('defaultPstRate', value);
              }}
              placeholder="0.07"
              value={formValues.defaultPstRate}
            />
          </View>
        </Row>
      </BottomSheetFormShell>
    </>
  );
}
