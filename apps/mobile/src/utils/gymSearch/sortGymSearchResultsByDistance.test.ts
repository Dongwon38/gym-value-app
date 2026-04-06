import type { GymSearchResult } from '../../domain/gymSearch/types';
import { sortGymSearchResultsByDistance } from './sortGymSearchResultsByDistance';

describe('sortGymSearchResultsByDistance', () => {
  const base = (name: string, lat: number, lng: number): GymSearchResult => ({
    brandName: null,
    city: null,
    countryCode: null,
    formattedAddress: null,
    latitude: lat,
    longitude: lng,
    name,
    placeId: null,
    postalCode: null,
    region: null,
    source: 'google_places',
  });

  it('orders by distance from anchor', () => {
    const anchorLat = 49.25;
    const anchorLng = -123.1;
    const rows: GymSearchResult[] = [
      base('Far', 40.7, -74.0),
      base('Near', 49.26, -123.11),
      base('Mid', 49.3, -123.05),
    ];

    const names = sortGymSearchResultsByDistance(
      rows,
      anchorLat,
      anchorLng,
    ).map(r => r.name);

    expect(names).toEqual(['Near', 'Mid', 'Far']);
  });
});
