jest.mock('../../location/useDeviceLocation', () => ({
  useDeviceLocation: jest.fn(),
}));

jest.mock('../useCases/autocompleteGyms', () => ({
  autocompleteGyms: jest.fn(),
}));

jest.mock('../useCases/browseNearbyGyms', () => ({
  browseNearbyGyms: jest.fn(),
}));

jest.mock('../useCases/loadGymPlaceDetails', () => ({
  loadGymPlaceDetails: jest.fn(),
}));

jest.mock('../useCases/saveGymFromSearchResult', () => ({
  saveGymFromSearchResult: jest.fn(),
}));

jest.mock('../useCases/searchGyms', () => ({
  searchGyms: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { useDeviceLocation } from '../../location/useDeviceLocation';
import { autocompleteGyms } from '../useCases/autocompleteGyms';
import { browseNearbyGyms } from '../useCases/browseNearbyGyms';
import { loadGymPlaceDetails } from '../useCases/loadGymPlaceDetails';
import { saveGymFromSearchResult } from '../useCases/saveGymFromSearchResult';
import { searchGyms } from '../useCases/searchGyms';
import {
  useGymSearchFlow,
  type GymSetupEditorTab,
} from './useGymSearchFlow';

type HookHarnessProps = {
  editorTab: GymSetupEditorTab;
  editorVisible: boolean;
  onSaved?: () => Promise<void>;
  primaryGym?: { latitude: number; longitude: number } | null;
};

let latestHookState: ReturnType<typeof useGymSearchFlow> | null = null;

function HookHarness({
  editorTab,
  editorVisible,
  onSaved,
  primaryGym,
}: HookHarnessProps) {
  latestHookState = useGymSearchFlow({
    editorTab,
    editorVisible,
    onSaved: onSaved ?? (async () => {}),
    primaryGym,
  });
  return null;
}

async function flushEffects() {
  await Promise.resolve();
  await Promise.resolve();
}

function createSearchResult(
  overrides: Partial<{
    source: 'google_places' | 'internal_db';
    placeId: string | null;
    name: string;
    latitude: number;
    longitude: number;
  }> = {},
) {
  return {
    latitude: 49.2827,
    longitude: -123.1207,
    name: 'GoodLife Fitness',
    placeId: 'place_1',
    source: 'google_places' as const,
    ...overrides,
  };
}

describe('useGymSearchFlow', () => {
  const clearDeviceCoords = jest.fn();
  const refreshDeviceLocation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    latestHookState = null;
    jest.useFakeTimers();
    refreshDeviceLocation.mockResolvedValue(null);
    (useDeviceLocation as jest.Mock).mockReturnValue({
      clearDeviceCoords,
      coords: null,
      isRefreshing: false,
      refresh: refreshDeviceLocation,
    });
    (searchGyms as jest.Mock).mockResolvedValue({
      fromPlacesCache: false,
      placesLimitReached: false,
      results: [createSearchResult()],
      usedPlacesFallback: true,
    });
    (autocompleteGyms as jest.Mock).mockResolvedValue([]);
    (browseNearbyGyms as jest.Mock).mockResolvedValue({
      fromPlacesCache: false,
      placesLimitReached: false,
      results: [],
      usedPlacesFallback: false,
    });
    (loadGymPlaceDetails as jest.Mock).mockResolvedValue(null);
    (saveGymFromSearchResult as jest.Mock).mockResolvedValue({
      id: 'gym_1',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resets transient search state whenever the editor opens', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HookHarness editorTab="search" editorVisible={false} />,
      );
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      latestHookState?.setSearchQuery('goodlife');
      latestHookState?.setConfirmRadius('80');
      latestHookState?.selectResult(createSearchResult());
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(<HookHarness editorTab="search" editorVisible />);
      await flushEffects();
    });

    expect(latestHookState?.searchQuery).toBe('');
    expect(latestHookState?.selectedResult).toBeNull();
    expect(latestHookState?.confirmRadius).toBe('150');
    expect(clearDeviceCoords).toHaveBeenCalled();
  });

  it('runs search with the primary gym anchor by default', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <HookHarness
          editorTab="search"
          editorVisible
          primaryGym={{ latitude: 49.25, longitude: -123.1 }}
        />,
      );
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      latestHookState?.setSearchQuery('goodlife');
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      await latestHookState?.executeGymSearch();
      await flushEffects();
    });

    expect(searchGyms).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'goodlife',
        userLatitude: 49.25,
        userLongitude: -123.1,
      }),
    );
    expect(latestHookState?.searchResults).toHaveLength(1);
  });

  it('saves a selected search result through the stable save path', async () => {
    const onSaved = jest.fn().mockResolvedValue(undefined);

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <HookHarness editorTab="search" editorVisible onSaved={onSaved} />,
      );
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      latestHookState?.selectResult(createSearchResult());
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      await latestHookState?.handleSearchSave();
      await flushEffects();
    });

    expect(saveGymFromSearchResult).toHaveBeenCalledWith(
      expect.objectContaining({
        externalPlaceId: 'place_1',
        name: 'GoodLife Fitness',
        radiusMeters: 150,
        searchSource: 'google_places',
      }),
      expect.objectContaining({
        source: 'places',
      }),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('starts an autocomplete session and loads suggestions after debounce', async () => {
    (autocompleteGyms as jest.Mock).mockResolvedValue([
      {
        mainText: 'GoodLife Burnaby',
        placeId: 'suggestion_1',
        secondaryText: 'Burnaby, BC',
      },
    ]);

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <HookHarness editorTab="search" editorVisible />,
      );
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      latestHookState?.setSearchQuery('goodlife');
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(300);
      await flushEffects();
    });

    expect(autocompleteGyms).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'goodlife',
        sessionToken: expect.any(String),
      }),
    );
    expect(latestHookState?.autocompleteSuggestions).toHaveLength(1);
    expect(latestHookState?.autocompleteSessionToken).toEqual(
      expect.any(String),
    );
  });

  it('uses place details when a suggestion resolves to save-ready coordinates', async () => {
    (loadGymPlaceDetails as jest.Mock).mockResolvedValue({
      latitude: 49.25,
      longitude: -123.1,
      name: 'GoodLife Burnaby',
      placeId: 'place_detail_1',
    });

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <HookHarness editorTab="search" editorVisible />,
      );
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      await latestHookState?.selectSuggestion({
        mainText: 'GoodLife Burnaby',
        placeId: 'suggestion_1',
        secondaryText: 'Burnaby, BC',
      });
      await flushEffects();
    });

    expect(loadGymPlaceDetails).toHaveBeenCalledWith('suggestion_1');
    expect(latestHookState?.selectedResult).toEqual(
      expect.objectContaining({
        latitude: 49.25,
        longitude: -123.1,
        name: 'GoodLife Burnaby',
        placeId: 'place_detail_1',
      }),
    );
  });

  it('falls back to seeded text search when suggestion details are unavailable', async () => {
    (loadGymPlaceDetails as jest.Mock).mockResolvedValue(null);

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <HookHarness editorTab="search" editorVisible />,
      );
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      await latestHookState?.selectSuggestion({
        mainText: 'GoodLife Burnaby',
        placeId: 'suggestion_1',
        secondaryText: 'Burnaby, BC',
      });
      await flushEffects();
    });

    expect(searchGyms).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'GoodLife Burnaby',
      }),
    );
    expect(latestHookState?.selectedResult).toBeNull();
    expect(latestHookState?.searchQuery).toBe('GoodLife Burnaby');
  });

  it('loads nearby gyms once when the editor opens with an available anchor and empty query', async () => {
    (browseNearbyGyms as jest.Mock).mockResolvedValue({
      fromPlacesCache: false,
      placesLimitReached: false,
      results: [createSearchResult({ name: 'Nearby Gym' })],
      usedPlacesFallback: true,
    });

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <HookHarness
          editorTab="search"
          editorVisible
          primaryGym={{ latitude: 49.25, longitude: -123.1 }}
        />,
      );
      await flushEffects();
    });

    expect(browseNearbyGyms).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 49.25,
        longitude: -123.1,
        radiusMeters: 5000,
      }),
    );
    expect(latestHookState?.searchResults[0]?.name).toBe('Nearby Gym');
  });

  it('does not refetch nearby gyms on rerender when the anchor context is unchanged', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HookHarness
          editorTab="search"
          editorVisible
          primaryGym={{ latitude: 49.25, longitude: -123.1 }}
        />,
      );
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <HookHarness
          editorTab="search"
          editorVisible
          primaryGym={{ latitude: 49.25, longitude: -123.1 }}
        />,
      );
      await flushEffects();
    });

    expect(browseNearbyGyms).toHaveBeenCalledTimes(1);
  });

  it('refetches nearby gyms when the anchor changes materially', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HookHarness
          editorTab="search"
          editorVisible
          primaryGym={{ latitude: 49.25, longitude: -123.1 }}
        />,
      );
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <HookHarness
          editorTab="search"
          editorVisible
          primaryGym={{ latitude: 49.55, longitude: -123.5 }}
        />,
      );
      await flushEffects();
    });

    expect(browseNearbyGyms).toHaveBeenCalledTimes(2);
    expect(browseNearbyGyms).toHaveBeenLastCalledWith(
      expect.objectContaining({
        latitude: 49.55,
        longitude: -123.5,
        radiusMeters: 5000,
      }),
    );
  });
});
