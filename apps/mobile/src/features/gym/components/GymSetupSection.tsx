import React from 'react';
import { View } from 'react-native';

import { useGymSetupForm } from '../hooks/useGymSetupForm';
import {
  BottomSheetFormShell,
  Button,
  Card,
  Input,
  Row,
  SectionHeader,
  SettingsRow,
  Text,
} from '../../../ui';

function findFieldMessage(
  issues: Array<{ field: string; message: string }>,
  field: string,
) {
  return issues.find(issue => issue.field === field)?.message;
}

function formatCoordinateLabel(latitude?: number, longitude?: number) {
  if (latitude === undefined || longitude === undefined) {
    return 'Not set';
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function GymSetupSection() {
  const [editorVisible, setEditorVisible] = React.useState(false);
  const {
    errors,
    formValues,
    loadError,
    loadState,
    mode,
    primaryGym,
    reload,
    save,
    saveFeedback,
    saveState,
    setFieldValue,
    warnings,
  } = useGymSetupForm();

  async function handleSave() {
    const savedGym = await save();

    if (savedGym) {
      setEditorVisible(false);
    }
  }

  if (loadState === 'loading') {
    return <Card description="Loading primary gym details." title="Gym" />;
  }

  if (loadState === 'error') {
    return (
      <Card title="Gym">
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
        <SectionHeader label="Gym" title="Primary gym" />
        <Card padding="compact" shadow="soft">
          <SettingsRow label="Name" value={primaryGym?.name ?? 'Not set'} />
          <SettingsRow
            label="Location"
            value={formatCoordinateLabel(primaryGym?.latitude, primaryGym?.longitude)}
          />
          <SettingsRow
            label="Radius"
            value={primaryGym ? `${primaryGym.radiusMeters}m` : 'Not set'}
          />
          <SettingsRow
            label="Timezone"
            last
            value={primaryGym?.timezone ?? 'Not set'}
          />
        </Card>

        <Row className="gap-3">
          <Button
            className="flex-1"
            label={mode === 'edit' ? 'Edit Gym' : 'Set Up Gym'}
            onPress={() => {
              setEditorVisible(true);
            }}
            variant="secondary"
          />
        </Row>

        {saveFeedback ? (
          <Text tone={saveState === 'error' ? 'destructive' : 'success'} variant="bodyMuted">
            {saveFeedback}
          </Text>
        ) : null}
      </View>

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
              label={
                saveState === 'saving'
                  ? 'Saving...'
                  : mode === 'edit'
                    ? 'Save Gym'
                    : 'Create Gym'
              }
              onPress={handleSave}
            />
          </Row>
        }
        onClose={() => {
          setEditorVisible(false);
        }}
        subtitle="Manual coordinates, radius, and timezone"
        title={mode === 'edit' ? 'Edit Gym' : 'Set Up Gym'}
        visible={editorVisible}>
        <Input
          autoCapitalize="words"
          errorText={findFieldMessage(errors, 'name')}
          label="Name"
          onChangeText={value => {
            setFieldValue('name', value);
          }}
          placeholder="Downtown Fitness Club"
          value={formValues.name}
        />

        <Row align="start" className="gap-3">
          <View className="flex-1">
            <Input
              autoCapitalize="none"
              errorText={findFieldMessage(errors, 'latitude')}
              keyboardType="decimal-pad"
              label="Latitude"
              onChangeText={value => {
                setFieldValue('latitude', value);
              }}
              placeholder="49.2827"
              value={formValues.latitude}
            />
          </View>
          <View className="flex-1">
            <Input
              autoCapitalize="none"
              errorText={findFieldMessage(errors, 'longitude')}
              keyboardType="decimal-pad"
              label="Longitude"
              onChangeText={value => {
                setFieldValue('longitude', value);
              }}
              placeholder="-123.1207"
              value={formValues.longitude}
            />
          </View>
        </Row>

        <Row align="start" className="gap-3">
          <View className="flex-1">
            <Input
              autoCapitalize="none"
              errorText={findFieldMessage(errors, 'radiusMeters')}
              keyboardType="number-pad"
              label="Radius"
              onChangeText={value => {
                setFieldValue('radiusMeters', value);
              }}
              placeholder="150"
              value={formValues.radiusMeters}
            />
          </View>
          <View className="flex-1">
            <Input
              autoCapitalize="none"
              errorText={findFieldMessage(errors, 'timezone')}
              label="Timezone"
              onChangeText={value => {
                setFieldValue('timezone', value);
              }}
              placeholder="America/Vancouver"
              value={formValues.timezone}
            />
          </View>
        </Row>

        {warnings.length > 0 ? (
          <Card className="bg-warning-soft" padding="compact" shadow="none" variant="quiet">
            <View className="gap-2">
              {warnings.map(issue => (
                <Text key={issue.code} tone="warning" variant="bodyMuted">
                  {issue.message}
                </Text>
              ))}
            </View>
          </Card>
        ) : null}

        {saveFeedback ? (
          <Text tone={saveState === 'error' ? 'destructive' : 'success'} variant="bodyMuted">
            {saveFeedback}
          </Text>
        ) : null}
      </BottomSheetFormShell>
    </>
  );
}
