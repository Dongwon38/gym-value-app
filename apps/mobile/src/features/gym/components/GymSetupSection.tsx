import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { useDeviceLocation } from '../../location/useDeviceLocation';
import { useGymSetupForm } from '../hooks/useGymSetupForm';
import { saveGymFromSearchResult } from '../useCases/saveGymFromSearchResult';
import { searchGyms } from '../useCases/searchGyms';
import type {
  GymSearchResult,
  SaveGymFromSearchInput,
} from '../../../domain/gymSearch';
import {
  BottomSheetFormShell,
  Button,
  Card,
  Input,
  Row,
  SectionHeader,
  SettingsRow,
  Text,
  TimezonePickerField,
} from '../../../ui';
import { getDeviceIanaTimeZone } from '../../../utils/getDeviceIanaTimeZone';

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

function buildSaveInputFromSearchResult(
  result: GymSearchResult,
  radiusMeters: number,
  timezone: string,
): SaveGymFromSearchInput {
  return {
    brandName: result.brandName ?? null,
    city: result.city ?? null,
    countryCode: result.countryCode ?? null,
    existingGymId: result.gymId,
    externalPlaceId: result.placeId ?? null,
    formattedAddress: result.formattedAddress ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
    name: result.name,
    postalCode: result.postalCode ?? null,
    radiusMeters,
    region: result.region ?? null,
    searchSource:
      result.source === 'google_places' ? 'google_places' : 'internal_seed',
    timezone,
  };
}

type SetupEditorTab = 'manual' | 'search';

export function GymSetupSection() {
  const [editorVisible, setEditorVisible] = React.useState(false);
  const [editorTab, setEditorTab] = React.useState<SetupEditorTab>('search');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<GymSearchResult[]>(
    [],
  );
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchMeta, setSearchMeta] = React.useState<{
    fromPlacesCache: boolean;
    placesLimitReached: boolean;
    usedPlacesFallback: boolean;
  } | null>(null);
  const [queryUsedForLastSearch, setQueryUsedForLastSearch] =
    React.useState('');
  const [selectedResult, setSelectedResult] =
    React.useState<GymSearchResult | null>(null);
  const [confirmRadius, setConfirmRadius] = React.useState('150');
  const [confirmTimezone, setConfirmTimezone] = React.useState(
    getDeviceIanaTimeZone,
  );
  const [searchSaveError, setSearchSaveError] = React.useState<string | null>(
    null,
  );
  const [searchSaving, setSearchSaving] = React.useState(false);
  const [preferDeviceLocationForSearch, setPreferDeviceLocationForSearch] =
    React.useState(false);

  const {
    clearDeviceCoords,
    coords: deviceCoords,
    isRefreshing: deviceLocationRefreshing,
    refresh: refreshDeviceLocation,
  } = useDeviceLocation();

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

  React.useEffect(() => {
    if (!editorVisible) {
      return;
    }
    setEditorTab('search');
    setSearchQuery('');
    setSearchResults([]);
    setSearchMeta(null);
    setSelectedResult(null);
    setConfirmRadius('150');
    setConfirmTimezone(getDeviceIanaTimeZone());
    setSearchSaveError(null);
    setQueryUsedForLastSearch('');
    setPreferDeviceLocationForSearch(false);
    clearDeviceCoords();
  }, [clearDeviceCoords, editorVisible]);

  const canRunSearch =
    editorTab === 'search' &&
    !selectedResult &&
    searchQuery.trim().length >= 2 &&
    !searchLoading;

  async function executeGymSearch() {
    if (searchLoading || selectedResult || editorTab !== 'search') {
      return;
    }

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchMeta(null);
      return;
    }

    Keyboard.dismiss();
    setSearchLoading(true);
    try {
      const useDeviceBias =
        preferDeviceLocationForSearch &&
        deviceCoords !== null &&
        Number.isFinite(deviceCoords.latitude) &&
        Number.isFinite(deviceCoords.longitude);

      const out = await searchGyms({
        query: q,
        userLatitude: useDeviceBias
          ? deviceCoords.latitude
          : primaryGym?.latitude,
        userLongitude: useDeviceBias
          ? deviceCoords.longitude
          : primaryGym?.longitude,
      });
      setSearchResults(out.results);
      setSearchMeta({
        fromPlacesCache: out.fromPlacesCache,
        placesLimitReached: out.placesLimitReached,
        usedPlacesFallback: out.usedPlacesFallback,
      });
      setQueryUsedForLastSearch(q);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleManualSave() {
    const savedGym = await save();

    if (savedGym) {
      setEditorVisible(false);
    }
  }

  async function handleSearchSave() {
    if (!selectedResult) {
      return;
    }

    const radius = Number.parseInt(confirmRadius.trim(), 10);
    if (!Number.isFinite(radius) || radius < 30 || radius > 500) {
      setSearchSaveError('Radius must be between 30 and 500 meters.');
      return;
    }

    setSearchSaveError(null);
    setSearchSaving(true);

    try {
      await saveGymFromSearchResult(
        buildSaveInputFromSearchResult(
          selectedResult,
          radius,
          confirmTimezone.trim(),
        ),
        {
          query: queryUsedForLastSearch,
          source:
            selectedResult.source === 'google_places' ? 'places' : 'local',
        },
      );
      await reload();
      setEditorVisible(false);
    } catch (e) {
      setSearchSaveError(
        e instanceof Error ? e.message : 'Could not save gym from search.',
      );
    } finally {
      setSearchSaving(false);
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

  const showPlacesLimitBanner =
    editorTab === 'search' &&
    searchMeta?.placesLimitReached &&
    !searchMeta.usedPlacesFallback;

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
          selectedResult ? (
            <Row className="gap-3">
              <Button
                className="flex-1"
                label="Back"
                onPress={() => {
                  setSelectedResult(null);
                  setSearchSaveError(null);
                }}
                variant="secondary"
              />
              <Button
                className="flex-1"
                disabled={searchSaving}
                label={searchSaving ? 'Saving...' : 'Save Gym'}
                onPress={handleSearchSave}
              />
            </Row>
          ) : editorTab === 'manual' ? (
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
                onPress={handleManualSave}
              />
            </Row>
          ) : (
            <Row className="gap-3">
              <Button
                className="flex-1"
                label="Cancel"
                onPress={() => {
                  setEditorVisible(false);
                }}
                variant="secondary"
              />
            </Row>
          )
        }
        onClose={() => {
          setEditorVisible(false);
        }}
        subtitle={
          selectedResult
            ? 'Confirm radius and timezone'
            : 'Search the web or enter details manually'
        }
        title={mode === 'edit' ? 'Edit Gym' : 'Set Up Gym'}
        visible={editorVisible}>
        {!selectedResult ? (
          <View className="gap-4">
            <Row className="gap-2">
              <Button
                className="flex-1"
                label="Search gym"
                onPress={() => {
                  setEditorTab('search');
                }}
                variant={editorTab === 'search' ? 'primary' : 'secondary'}
              />
              <Button
                className="flex-1"
                label="Enter manually"
                onPress={() => {
                  setEditorTab('manual');
                }}
                variant={editorTab === 'manual' ? 'primary' : 'secondary'}
              />
            </Row>

            {editorTab === 'search' ? (
              <View className="gap-3">
                <Input
                  autoCapitalize="words"
                  blurOnSubmit
                  editable={!searchLoading}
                  label="Search"
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => {
                    void executeGymSearch();
                  }}
                  placeholder="GoodLife Burnaby, Anytime Fitness…"
                  returnKeyType="search"
                  value={searchQuery}
                />
                <Text variant="bodyMuted">
                  Tap Search or the keyboard search key — queries do not run while
                  typing. Without using current location or a saved gym, results may
                  follow your phone&apos;s region only.
                </Text>
                <View className="gap-2">
                  <Button
                    className="self-stretch"
                    disabled={deviceLocationRefreshing || searchLoading}
                    label={
                      deviceLocationRefreshing
                        ? 'Getting location…'
                        : 'Use current location for search'
                    }
                    onPress={() => {
                      refreshDeviceLocation().then(next => {
                        setPreferDeviceLocationForSearch(next !== null);
                      });
                    }}
                    variant="secondary"
                  />
                  {preferDeviceLocationForSearch && deviceCoords ? (
                    <View className="gap-2">
                      <Text variant="bodyMuted">
                        Results are biased toward your current location. This does not
                        change your saved gym.
                      </Text>
                      <Pressable
                        className="self-start py-1 active:opacity-70"
                        onPress={() => {
                          clearDeviceCoords();
                          setPreferDeviceLocationForSearch(false);
                        }}>
                        <Text variant="bodyMuted">
                          Use saved gym area instead
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                <Button
                  className="self-stretch"
                  disabled={!canRunSearch}
                  label={searchLoading ? 'Searching…' : 'Search'}
                  onPress={() => {
                    void executeGymSearch();
                  }}
                />
                {searchLoading ? (
                  <Row className="items-center gap-2 py-2">
                    <ActivityIndicator />
                    <Text variant="bodyMuted">Searching…</Text>
                  </Row>
                ) : null}
                {showPlacesLimitBanner ? (
                  <Card
                    className="bg-warning-soft"
                    padding="compact"
                    shadow="none"
                    variant="quiet">
                    <Text tone="warning" variant="bodyMuted">
                      Search limit reached for today. You can still enter your gym
                      manually or pick a local match above.
                    </Text>
                  </Card>
                ) : null}
                {searchResults.length > 3 ? (
                  <Text tone="secondary" variant="bodyMuted">
                    Scroll the list below for more results ({searchResults.length}{' '}
                    total).
                  </Text>
                ) : null}
                <ScrollView
                  className="max-h-96"
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled>
                  {searchResults.map(item => (
                    <Pressable
                      key={`${item.source}-${item.gymId ?? item.placeId ?? item.name}-${item.latitude}-${item.longitude}`}
                      className="border-b border-border/60 py-3 active:opacity-70"
                      onPress={() => {
                        setSelectedResult(item);
                        setSearchSaveError(null);
                      }}>
                      <Text variant="listTitle">{item.name}</Text>
                      {item.formattedAddress ? (
                        <Text className="mt-1" variant="bodyMuted">
                          {item.formattedAddress}
                        </Text>
                      ) : null}
                      <Text className="mt-1" variant="bodyMuted">
                        {item.source === 'internal_db' ? 'Saved gym' : 'Google Places'}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <>
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

                <Input
                  autoCapitalize="none"
                  errorText={findFieldMessage(errors, 'radiusMeters')}
                  keyboardType="number-pad"
                  label="Radius (meters)"
                  onChangeText={value => {
                    setFieldValue('radiusMeters', value);
                  }}
                  placeholder="150"
                  value={formValues.radiusMeters}
                />
                <TimezonePickerField
                  errorText={findFieldMessage(errors, 'timezone')}
                  label="Timezone"
                  onValueChange={value => {
                    setFieldValue('timezone', value);
                  }}
                  value={formValues.timezone}
                />

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
              </>
            )}
          </View>
        ) : (
          <View className="gap-4">
            <Text variant="listTitle">{selectedResult.name}</Text>
            {selectedResult.formattedAddress ? (
              <Text variant="bodyMuted">{selectedResult.formattedAddress}</Text>
            ) : null}
            <Input
              autoCapitalize="none"
              keyboardType="number-pad"
              label="Radius (meters)"
              onChangeText={setConfirmRadius}
              value={confirmRadius}
            />
            <TimezonePickerField
              label="Timezone"
              onValueChange={setConfirmTimezone}
              value={confirmTimezone}
            />
            {searchSaveError ? (
              <Text tone="destructive" variant="bodyMuted">
                {searchSaveError}
              </Text>
            ) : null}
          </View>
        )}
      </BottomSheetFormShell>
    </>
  );
}
