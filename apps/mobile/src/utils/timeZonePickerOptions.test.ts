import { timeZoneOptionMatchesQuery } from './timeZonePickerOptions';

describe('timeZoneOptionMatchesQuery', () => {
  const option = {
    iana: 'America/Vancouver',
    subtitle: 'Canada · Pacific Time · Vancouver, Surrey',
    title: 'America/Vancouver',
  };

  it('matches IANA substring', () => {
    expect(timeZoneOptionMatchesQuery(option, 'vancouver')).toBe(true);
  });

  it('matches subtitle', () => {
    expect(timeZoneOptionMatchesQuery(option, 'pacific')).toBe(true);
    expect(timeZoneOptionMatchesQuery(option, 'canada')).toBe(true);
  });

  it('returns true for empty query', () => {
    expect(timeZoneOptionMatchesQuery(option, '')).toBe(true);
    expect(timeZoneOptionMatchesQuery(option, '   ')).toBe(true);
  });
});
