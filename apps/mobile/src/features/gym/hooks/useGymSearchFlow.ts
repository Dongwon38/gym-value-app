import React from 'react';
import { Keyboard } from 'react-native';

import { useDeviceLocation } from '../../location/useDeviceLocation';
import { saveGymFromSearchResult } from '../useCases/saveGymFromSearchResult';
import { searchGyms } from '../useCases/searchGyms';
import type { GymSearchResult, SaveGymFromSearchInput } from '../../../domain/gymSearch';
import { getDeviceIanaTimeZone } from '../../../utils/getDeviceIanaTimeZone';

export type GymSetupEditorTab = 'manual' | 'search';

type SearchMeta = {
  fromPlacesCache: boolean;
  placesLimitReached: boolean;
  usedPlacesFallback: boolean;
};

type UseGymSearchFlowParams = {
  editorTab: GymSetupEditorTab;
  editorVisible: boolean;
  onSaved: () => Promise<void>;
  primaryGym?: {
    latitude: number;
    longitude: number;
  } | null;
};

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

export function useGymSearchFlow({
  editorTab,
  editorVisible,
  onSaved,
  primaryGym,
}: UseGymSearchFlowParams) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<GymSearchResult[]>(
    [],
  );
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchMeta, setSearchMeta] = React.useState<SearchMeta | null>(null);
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

  React.useEffect(() => {
    if (!editorVisible) {
      return;
    }

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

  const executeGymSearch = React.useCallback(async () => {
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
  }, [
    deviceCoords,
    editorTab,
    preferDeviceLocationForSearch,
    primaryGym,
    searchLoading,
    searchQuery,
    selectedResult,
  ]);

  const requestDeviceLocationBias = React.useCallback(async () => {
    const next = await refreshDeviceLocation();
    setPreferDeviceLocationForSearch(next !== null);
    return next;
  }, [refreshDeviceLocation]);

  const clearDeviceLocationBias = React.useCallback(() => {
    clearDeviceCoords();
    setPreferDeviceLocationForSearch(false);
  }, [clearDeviceCoords]);

  const clearSelectedResult = React.useCallback(() => {
    setSelectedResult(null);
    setSearchSaveError(null);
  }, []);

  const selectResult = React.useCallback((result: GymSearchResult) => {
    setSelectedResult(result);
    setSearchSaveError(null);
  }, []);

  const handleSearchSave = React.useCallback(async () => {
    if (!selectedResult) {
      return false;
    }

    const radius = Number.parseInt(confirmRadius.trim(), 10);
    if (!Number.isFinite(radius) || radius < 30 || radius > 500) {
      setSearchSaveError('Radius must be between 30 and 500 meters.');
      return false;
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
      await onSaved();
      return true;
    } catch (e) {
      setSearchSaveError(
        e instanceof Error ? e.message : 'Could not save gym from search.',
      );
      return false;
    } finally {
      setSearchSaving(false);
    }
  }, [
    confirmRadius,
    confirmTimezone,
    onSaved,
    queryUsedForLastSearch,
    selectedResult,
  ]);

  return {
    canRunSearch,
    clearDeviceLocationBias,
    clearSelectedResult,
    confirmRadius,
    confirmTimezone,
    deviceCoords,
    deviceLocationRefreshing,
    executeGymSearch,
    handleSearchSave,
    preferDeviceLocationForSearch,
    requestDeviceLocationBias,
    searchLoading,
    searchMeta,
    searchQuery,
    searchResults,
    searchSaveError,
    searchSaving,
    selectedResult,
    setConfirmRadius,
    setConfirmTimezone,
    setSearchQuery,
    selectResult,
  };
}
