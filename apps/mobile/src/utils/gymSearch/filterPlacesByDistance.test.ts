import type { GymSearchResult } from '../../domain/gymSearch/types';
import { filterPlacesResultsByDistance } from './filterPlacesByDistance';

function place(
  name: string,
  lat: number,
  lng: number,
): GymSearchResult {
  return {
    latitude: lat,
    longitude: lng,
    name,
    source: 'google_places',
  };
}

describe('filterPlacesResultsByDistance', () => {
  it('removes rows beyond maxKm from anchor', () => {
    const vancouver = place('Near', 49.25, -123.1);
    const siouxFalls = place('Far', 43.54, -96.73);
    const out = filterPlacesResultsByDistance(
      [vancouver, siouxFalls],
      49.25,
      -123.1,
      300,
    );
    expect(out.map(r => r.name)).toEqual(['Near']);
  });

  it('returns all when maxKm is zero', () => {
    const rows = [place('A', 1, 2)];
    expect(filterPlacesResultsByDistance(rows, 0, 0, 0)).toEqual(rows);
  });
});
