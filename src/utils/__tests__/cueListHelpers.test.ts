import { convertCueIndexForLocalState } from '../cueListHelpers';

describe('cueListHelpers', () => {
  describe('convertCueIndexForLocalState', () => {
    it('returns the index for valid numbers', () => {
      expect(convertCueIndexForLocalState(0)).toBe(0);
      expect(convertCueIndexForLocalState(1)).toBe(1);
      expect(convertCueIndexForLocalState(5)).toBe(5);
      expect(convertCueIndexForLocalState(10)).toBe(10);
    });

    it('returns -1 for null', () => {
      expect(convertCueIndexForLocalState(null)).toBe(-1);
    });

    it('returns -1 for undefined', () => {
      expect(convertCueIndexForLocalState(undefined)).toBe(-1);
    });

    it('handles negative numbers correctly', () => {
      expect(convertCueIndexForLocalState(-1)).toBe(-1);
      expect(convertCueIndexForLocalState(-5)).toBe(-5);
    });

    it('handles zero correctly', () => {
      expect(convertCueIndexForLocalState(0)).toBe(0);
    });

    it('handles edge cases', () => {
      expect(convertCueIndexForLocalState(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
      expect(convertCueIndexForLocalState(Number.MIN_SAFE_INTEGER)).toBe(Number.MIN_SAFE_INTEGER);
    });
  });
});