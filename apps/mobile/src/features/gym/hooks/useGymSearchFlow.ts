import React from 'react';
import { Keyboard } from 'react-native';

import { useDeviceLocation } from '../../location/useDeviceLocation';
import { autocompleteGyms } from '../useCases/autocompleteGyms';
import { browseNearbyGyms } from '../useCases/browseNearbyGyms';
import { loadGymPlaceDetails } from '../useCases/loadGymPlaceDetails';
import {
  buildSaveInputFromGymSearchResult,
  buildSearchResultFromPlaceDetails,
  mapSearchResultSourceToTelemetrySource,
} from '../useCases/searchResultMapping';
import { saveGymFromSearchResult } from '../useCases/saveGymFromSearchResult';
import { searchGyms } from '../useCases/searchGyms';
import type {
  GymSearchResult,
  GymSearchSuggestion,
} from '../../../domain/gymSearch';
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

function createAutocompleteSessionToken() {
  return `gym_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function roundAnchorCoord(value: number) {
  return String(Math.round(value * 100) / 100);
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
  const [autocompleteSuggestions, setAutocompleteSuggestions] =
    React.useState<GymSearchSuggestion[]>([]);
  const [autocompleteLoading, setAutocompleteLoading] = React.useState(false);
  const [autocompleteSessionToken, setAutocompleteSessionToken] =
    React.useState<string | null>(null);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [nearbyLoading, setNearbyLoading] = React.useState(false);
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
  const autocompleteTokenRef = React.useRef<string | null>(null);
  const lastNearbyFetchKeyRef = React.useRef<string | null>(null);

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
    setAutocompleteSuggestions([]);
    setAutocompleteLoading(false);
    setNearbyLoading(false);
    autocompleteTokenRef.current = null;
    lastNearbyFetchKeyRef.current = null;
    setAutocompleteSessionToken(null);
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

  const resolveAnchor = React.useCallback(() => {
    const useDeviceBias =
      preferDeviceLocationForSearch &&
      deviceCoords !== null &&
      Number.isFinite(deviceCoords.latitude) &&
      Number.isFinite(deviceCoords.longitude);

    return {
      latitude: useDeviceBias ? deviceCoords.latitude : primaryGym?.latitude,
      longitude: useDeviceBias ? deviceCoords.longitude : primaryGym?.longitude,
    };
  }, [deviceCoords, preferDeviceLocationForSearch, primaryGym]);

  const buildNearbyContextKey = React.useCallback(() => {
    const anchor = resolveAnchor();
    if (
      anchor.latitude === undefined ||
      anchor.longitude === undefined ||
      !Number.isFinite(anchor.latitude) ||
      !Number.isFinite(anchor.longitude)
    ) {
      return null;
    }

    return `${roundAnchorCoord(anchor.latitude)}_${roundAnchorCoord(anchor.longitude)}_5000`;
  }, [resolveAnchor]);

  const clearAutocompleteSession = React.useCallback(() => {
    autocompleteTokenRef.current = null;
    setAutocompleteSessionToken(null);
    setAutocompleteSuggestions([]);
    setAutocompleteLoading(false);
  }, []);

  const ensureAutocompleteSessionToken = React.useCallback(() => {
    if (autocompleteTokenRef.current) {
      return autocompleteTokenRef.current;
    }

    const nextToken = createAutocompleteSessionToken();
    autocompleteTokenRef.current = nextToken;
    setAutocompleteSessionToken(nextToken);
    return nextToken;
  }, []);

  const runTextSearch = React.useCallback(
    async (rawQuery: string) => {
      const q = rawQuery.trim();
      if (q.length < 2) {
        setSearchResults([]);
        setSearchMeta(null);
        return;
      }

      Keyboard.dismiss();
      setSearchLoading(true);
      try {
        const anchor = resolveAnchor();
        const out = await searchGyms({
          query: q,
          userLatitude: anchor.latitude,
          userLongitude: anchor.longitude,
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
    },
    [resolveAnchor],
  );

  const executeGymSearch = React.useCallback(async () => {
    if (searchLoading || selectedResult || editorTab !== 'search') {
      return;
    }

    clearAutocompleteSession();
    await runTextSearch(searchQuery);
  }, [
    clearAutocompleteSession,
    editorTab,
    runTextSearch,
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

  const loadNearbyGyms = React.useCallback(
    async (force = false) => {
      const anchor = resolveAnchor();
      if (
        anchor.latitude === undefined ||
        anchor.longitude === undefined ||
        !Number.isFinite(anchor.latitude) ||
        !Number.isFinite(anchor.longitude)
      ) {
        return false;
      }

      const contextKey = buildNearbyContextKey();
      if (!contextKey) {
        return false;
      }

      if (!force && lastNearbyFetchKeyRef.current === contextKey) {
        return false;
      }

      lastNearbyFetchKeyRef.current = contextKey;
      setNearbyLoading(true);
      try {
        const out = await browseNearbyGyms({
          latitude: anchor.latitude,
          longitude: anchor.longitude,
          radiusMeters: 5000,
        });
        setSearchResults(out.results);
        setSearchMeta({
          fromPlacesCache: out.fromPlacesCache,
          placesLimitReached: out.placesLimitReached,
          usedPlacesFallback: out.usedPlacesFallback,
        });
        setQueryUsedForLastSearch('');
        return true;
      } finally {
        setNearbyLoading(false);
      }
    },
    [buildNearbyContextKey, resolveAnchor],
  );

  const clearSelectedResult = React.useCallback(() => {
    setSelectedResult(null);
    setSearchSaveError(null);
  }, []);

  const selectResult = React.useCallback((result: GymSearchResult) => {
    setSelectedResult(result);
    setSearchSaveError(null);
  }, []);

  const selectSuggestion = React.useCallback(
    async (suggestion: GymSearchSuggestion) => {
      if (searchLoading) {
        return;
      }

      setSearchSaveError(null);
      setAutocompleteSuggestions([]);
      setSearchLoading(true);
      try {
        const details = await loadGymPlaceDetails(suggestion.placeId);
        if (details) {
          const nextQuery = suggestion.mainText.trim();
          setSearchQuery(nextQuery);
          setQueryUsedForLastSearch(nextQuery);
          setSelectedResult(buildSearchResultFromPlaceDetails(details));
          return;
        }

        const fallbackQuery = suggestion.mainText.trim();
        setSearchQuery(fallbackQuery);
        await runTextSearch(fallbackQuery);
      } finally {
        clearAutocompleteSession();
        setSearchLoading(false);
      }
    },
    [clearAutocompleteSession, runTextSearch, searchLoading],
  );

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
        buildSaveInputFromGymSearchResult(
          selectedResult,
          radius,
          confirmTimezone.trim(),
        ),
        {
          query: queryUsedForLastSearch,
          source: mapSearchResultSourceToTelemetrySource(selectedResult.source),
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

  React.useEffect(() => {
    if (!editorVisible || editorTab !== 'search' || selectedResult) {
      clearAutocompleteSession();
      return;
    }

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) {
      clearAutocompleteSession();
      return;
    }

    const timeoutId = setTimeout(() => {
      const sessionToken = ensureAutocompleteSessionToken();
      const anchor = resolveAnchor();
      setAutocompleteLoading(true);
      autocompleteGyms({
        query: trimmedQuery,
        sessionToken,
        userLatitude: anchor.latitude,
        userLongitude: anchor.longitude,
      })
        .then(suggestions => {
          if (searchQuery.trim() === trimmedQuery) {
            setAutocompleteSuggestions(suggestions);
          }
        })
        .finally(() => {
          if (searchQuery.trim() === trimmedQuery) {
            setAutocompleteLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    clearAutocompleteSession,
    editorTab,
    editorVisible,
    ensureAutocompleteSessionToken,
    resolveAnchor,
    searchQuery,
    selectedResult,
  ]);

  React.useEffect(() => {
    if (
      !editorVisible ||
      editorTab !== 'search' ||
      selectedResult ||
      searchQuery.trim().length > 0
    ) {
      return;
    }

    if (!buildNearbyContextKey()) {
      setSearchResults([]);
      setSearchMeta(null);
      return;
    }

    loadNearbyGyms().catch(() => undefined);
  }, [
    buildNearbyContextKey,
    editorTab,
    editorVisible,
    loadNearbyGyms,
    searchQuery,
    selectedResult,
  ]);

  return {
    autocompleteLoading,
    autocompleteSessionToken,
    autocompleteSuggestions,
    canRunSearch,
    clearDeviceLocationBias,
    clearSelectedResult,
    confirmRadius,
    confirmTimezone,
    deviceCoords,
    deviceLocationRefreshing,
    executeGymSearch,
    handleSearchSave,
    loadNearbyGyms,
    nearbyLoading,
    preferDeviceLocationForSearch,
    requestDeviceLocationBias,
    searchLoading,
    searchMeta,
    searchQuery,
    searchResults,
    searchSaveError,
    searchSaving,
    selectedResult,
    selectSuggestion,
    setConfirmRadius,
    setConfirmTimezone,
    setSearchQuery,
    selectResult,
  };
}
