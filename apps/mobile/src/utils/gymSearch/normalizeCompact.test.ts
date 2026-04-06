import { normalizeCompact } from './normalizeCompact';
import { makeGymDedupeKey } from './dedupeKey';

describe('normalizeCompact', () => {
  it('strips spaces and punctuation and lowercases', () => {
    expect(normalizeCompact('Club 16')).toBe('club16');
    expect(normalizeCompact('club-16')).toBe('club16');
    expect(normalizeCompact('CLUB  16')).toBe('club16');
  });

  it('returns empty for nullish', () => {
    expect(normalizeCompact(null)).toBe('');
    expect(normalizeCompact(undefined)).toBe('');
    expect(normalizeCompact('')).toBe('');
  });
});

describe('makeGymDedupeKey', () => {
  it('combines compact name and rounded coordinates', () => {
    expect(makeGymDedupeKey('Club 16', 49.282731, -123.120712)).toBe(
      'club16@49.28273,-123.12071',
    );
  });
});
