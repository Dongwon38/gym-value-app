import { defaultSearchGymsConfig } from '../../domain/gymSearch/searchGymsConfig';
import { scoreLocalGymCandidate, type LocalGymCandidate } from './scoreLocalGymCandidate';

function row(p: Partial<LocalGymCandidate>): LocalGymCandidate {
  return {
    id: 'g1',
    name: 'GoodLife Fitness',
    latitude: 49.25,
    longitude: -123.0,
    is_primary: 0,
    updated_at: '2026-01-01T00:00:00.000Z',
    ...p,
  };
}

describe('scoreLocalGymCandidate', () => {
  const cfg = defaultSearchGymsConfig;

  it('scores exact compact name highest', () => {
    const s = scoreLocalGymCandidate(
      row({ name: 'GoodLife Fitness', name_compact: 'goodlifefitness' }),
      'goodlife fitness',
      'goodlifefitness',
      undefined,
      undefined,
      cfg,
    );
    expect(s).toBeGreaterThanOrEqual(100);
  });

  it('adds distance boost when user location is near', () => {
    const near = scoreLocalGymCandidate(
      row({ name: 'Near Gym', name_compact: 'neargym' }),
      'near gym',
      'neargym',
      49.25,
      -123.0,
      cfg,
    );
    const far = scoreLocalGymCandidate(
      row({ name: 'Near Gym', name_compact: 'neargym' }),
      'near gym',
      'neargym',
      0,
      0,
      cfg,
    );
    expect(near).toBeGreaterThan(far);
  });
});
