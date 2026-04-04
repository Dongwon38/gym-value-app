import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Card, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { useGymSetupForm } from '../hooks/useGymSetupForm';
import { SettingsRow } from '../../settings/components/SettingsRow';

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
  const theme = useAppTheme();
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
        label={saveState === 'saving' ? 'Saving...' : mode === 'edit' ? 'Save Gym' : 'Create Gym'}
        onPress={handleSave}
        style={styles.primaryFooterButton}
      />
    </View>
  );

  if (loadState === 'loading') {
    return (
      <Card title="Gym">
        <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>
          Loading primary gym details.
        </Text>
      </Card>
    );
  }

  if (loadState === 'error') {
    return (
      <Card title="Gym">
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
      <Card title="Gym">
        <View>
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
        </View>

        <View style={styles.sectionFooter}>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Manual coordinates only for now
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEditorVisible(true);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.76 : 1 }]}>
            <Text style={[styles.inlineAction, { color: theme.colors.accent }]}>
              {mode === 'edit' ? 'Edit Gym' : 'Set Up Gym'}
            </Text>
          </Pressable>
        </View>

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

      <BottomSheet
        footer={footer}
        onClose={() => {
          setEditorVisible(false);
        }}
        subtitle="Manual coordinates, radius, and timezone"
        title={mode === 'edit' ? 'Edit Gym' : 'Set Up Gym'}
        visible={editorVisible}>
        <TextField
          autoCapitalize="words"
          errorMessage={findFieldMessage(errors, 'name')}
          label="Name"
          onChangeText={value => {
            setFieldValue('name', value);
          }}
          placeholder="Downtown Fitness Club"
          value={formValues.name}
        />
        <View style={styles.inlineFields}>
          <View style={styles.inlineField}>
            <TextField
              autoCapitalize="none"
              errorMessage={findFieldMessage(errors, 'latitude')}
              keyboardType="decimal-pad"
              label="Latitude"
              onChangeText={value => {
                setFieldValue('latitude', value);
              }}
              placeholder="49.2827"
              value={formValues.latitude}
            />
          </View>
          <View style={styles.inlineField}>
            <TextField
              autoCapitalize="none"
              errorMessage={findFieldMessage(errors, 'longitude')}
              keyboardType="decimal-pad"
              label="Longitude"
              onChangeText={value => {
                setFieldValue('longitude', value);
              }}
              placeholder="-123.1207"
              value={formValues.longitude}
            />
          </View>
        </View>
        <View style={styles.inlineFields}>
          <View style={styles.inlineField}>
            <TextField
              autoCapitalize="none"
              errorMessage={findFieldMessage(errors, 'radiusMeters')}
              keyboardType="number-pad"
              label="Radius"
              onChangeText={value => {
                setFieldValue('radiusMeters', value);
              }}
              placeholder="150"
              value={formValues.radiusMeters}
            />
          </View>
          <View style={styles.inlineField}>
            <TextField
              autoCapitalize="none"
              errorMessage={findFieldMessage(errors, 'timezone')}
              label="Timezone"
              onChangeText={value => {
                setFieldValue('timezone', value);
              }}
              placeholder="America/Vancouver"
              value={formValues.timezone}
            />
          </View>
        </View>

        {warnings.length > 0 ? (
          <View
            style={[
              styles.warningBox,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
              styles.warningBoxFill,
            ]}>
            {warnings.map(issue => (
              <Text
                key={issue.code}
                style={[styles.warning, { color: theme.colors.warning }]}>
                {issue.message}
              </Text>
            ))}
          </View>
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
  warning: {
    fontSize: 13,
    lineHeight: 18,
  },
  warningBox: {
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  warningBoxFill: {
    backgroundColor: '#F3E6CF',
  },
});
