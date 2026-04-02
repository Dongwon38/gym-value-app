import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, TextField } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme';
import { useGymSetupForm } from '../hooks/useGymSetupForm';

export function GymSetupSection() {
  const theme = useAppTheme();
  const {
    errors,
    formValues,
    hasReviewed,
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

  if (loadState === 'loading') {
    return (
      <Card
        subtitle="The app is checking whether an active primary gym already exists."
        title="Gym setup is loading">
        <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>
          As soon as the query finishes, this shell will switch into create or
          edit mode.
        </Text>
      </Card>
    );
  }

  if (loadState === 'error') {
    return (
      <Card
        subtitle="This blocks the setup shell because the screen cannot determine whether to create a new gym or edit the current primary gym."
        title="Couldn't load the primary gym">
        <Text style={[styles.copy, { color: theme.colors.danger }]}>
          {loadError}
        </Text>
        <PrimaryButton
          label="Retry Gym Query"
          onPress={reload}
          style={{ marginTop: theme.spacing.lg }}
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        subtitle={
          mode === 'edit'
            ? 'The form below is prefilled from the current active primary gym row.'
            : 'No primary gym is saved yet. Fill this shell so GYM-02 can wire persistence on top.'
        }
        title={
          mode === 'edit' ? 'Edit your primary gym' : 'Create your primary gym'
        }>
        <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>
          {mode === 'edit'
            ? `${primaryGym?.name} is currently marked as the active primary gym.`
            : 'Manual coordinates are the v0.1 setup path. Location-assisted entry comes later.'}
        </Text>
      </Card>

      <Card
        subtitle="This shell uses the shared form types and validation utilities from DOM-02."
        title="Gym setup form">
        <View style={styles.form}>
          <TextField
            autoCapitalize="words"
            errorMessage={findFieldMessage(errors, 'name')}
            label="Gym Name"
            onChangeText={value => {
              setFieldValue('name', value);
            }}
            placeholder="Downtown Fitness Club"
            value={formValues.name}
          />
          <TextField
            autoCapitalize="none"
            errorMessage={findFieldMessage(errors, 'latitude')}
            helperText="Use decimal coordinates for the gym center."
            keyboardType="decimal-pad"
            label="Latitude"
            onChangeText={value => {
              setFieldValue('latitude', value);
            }}
            placeholder="49.2827"
            value={formValues.latitude}
          />
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
          <TextField
            autoCapitalize="none"
            errorMessage={findFieldMessage(errors, 'radiusMeters')}
            helperText="Allowed range for v0.1 is 30m to 500m."
            keyboardType="number-pad"
            label="Radius (meters)"
            onChangeText={value => {
              setFieldValue('radiusMeters', value);
            }}
            placeholder="150"
            value={formValues.radiusMeters}
          />
          <TextField
            autoCapitalize="none"
            errorMessage={findFieldMessage(errors, 'timezone')}
            helperText="Use an IANA timezone like America/Vancouver."
            label="Timezone"
            onChangeText={value => {
              setFieldValue('timezone', value);
            }}
            placeholder="America/Vancouver"
            value={formValues.timezone}
          />
        </View>

        <PrimaryButton
          disabled={saveState === 'saving'}
          label={
            saveState === 'saving'
              ? 'Saving Gym...'
              : mode === 'edit'
                ? 'Save Gym Changes'
                : 'Create Primary Gym'
          }
          onPress={() => {
            save();
          }}
          style={{ marginTop: theme.spacing.xl }}
        />
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
          Saving keeps the current gym as the only active primary row.
        </Text>
      </Card>

      <Card
        subtitle="Validation blocks save. Warnings stay visible but do not prevent create/update."
        title="Save preview and feedback">
        {!hasReviewed ? (
          <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>
            Save the form to surface validation results and persistence feedback.
          </Text>
        ) : null}
        {hasReviewed && errors.length === 0 && warnings.length === 0 ? (
          <Text style={[styles.copy, { color: theme.colors.accent }]}>
            This draft passes validation and is ready for GYM-02 save wiring.
          </Text>
        ) : null}
        {hasReviewed && (errors.length > 0 || warnings.length > 0) ? (
          <View style={styles.issueList}>
            {errors.map(issue => (
              <Text
                key={issue.code}
                style={[styles.issue, { color: theme.colors.danger }]}>
                {`\u2022 ${issue.message}`}
              </Text>
            ))}
            {warnings.map(issue => (
              <Text
                key={issue.code}
                style={[styles.issue, { color: theme.colors.warning }]}>
                {`\u2022 ${issue.message}`}
              </Text>
            ))}
            {errors.length === 0 ? (
              <Text style={[styles.copy, { color: theme.colors.accent }]}>
                This draft passes blocking validation. Review the warning before
                save wiring lands in GYM-02.
              </Text>
            ) : null}
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
  form: {
    gap: 16,
  },
  feedback: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
  issue: {
    fontSize: 14,
    lineHeight: 20,
  },
  issueList: {
    gap: 12,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
});
