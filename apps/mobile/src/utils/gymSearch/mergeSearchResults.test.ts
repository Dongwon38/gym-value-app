import type { GymSearchResult } from '../../domain/gymSearch/types';
import { mergeSearchResults } from './mergeSearchResults';

function r(p: Partial<GymSearchResult>): GymSearchResult {
  return {
    latitude: 1,
    longitude: 2,
    name: 'Gym',
    source: 'internal_db',
    ...p,
  };
}

describe('mergeSearchResults', () => {
  it('keeps locals first and skips duplicate place ids', () => {
    const merged = mergeSearchResults(
      [r({ gymId: 'a', name: 'Local', placeId: 'p1' })],
      [r({ source: 'google_places', name: 'Dup', placeId: 'p1' })],
      10,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.name).toBe('Local');
  });
});
