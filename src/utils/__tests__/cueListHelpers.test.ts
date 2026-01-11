import { convertCueIndexForLocalState, calculateNextCueNumber } from '../cueListHelpers';

describe('cueListHelpers', () => {
  describe('convertCueIndexForLocalState', () => {
    it('returns the index when provided a number', () => {
      expect(convertCueIndexForLocalState(0)).toBe(0);
      expect(convertCueIndexForLocalState(5)).toBe(5);
      expect(convertCueIndexForLocalState(100)).toBe(100);
    });

    it('returns -1 for null', () => {
      expect(convertCueIndexForLocalState(null)).toBe(-1);
    });

    it('returns -1 for undefined', () => {
      expect(convertCueIndexForLocalState(undefined)).toBe(-1);
    });
  });

  describe('calculateNextCueNumber', () => {
    describe('basic incrementing', () => {
      it('adds 0.1 when there is room before the next cue', () => {
        // Cues 1, 2, 3 - duplicate 1 should give 1.1
        expect(calculateNextCueNumber(1, [1, 2, 3])).toBe(1.1);
        expect(calculateNextCueNumber(2, [1, 2, 3])).toBe(2.1);
      });

      it('continues incrementing by 0.1 when space allows', () => {
        // Cues 1, 1.1, 2 - duplicate 1.1 should give 1.2
        expect(calculateNextCueNumber(1.1, [1, 1.1, 2])).toBe(1.2);
        // Cues 1, 1.2, 2 - duplicate 1.2 should give 1.3
        expect(calculateNextCueNumber(1.2, [1, 1.2, 2])).toBe(1.3);
      });

      it('handles sequential decimals', () => {
        // Cues 1, 1.1, 1.2, 1.3, 2 - duplicate 1.3 should give 1.4
        expect(calculateNextCueNumber(1.3, [1, 1.1, 1.2, 1.3, 2])).toBe(1.4);
      });
    });

    describe('switching to smaller increments', () => {
      it('uses 0.01 when 0.1 would exceed next cue', () => {
        // Cues 1.9, 2 - duplicate 1.9 should give 1.91 (not 2.0)
        expect(calculateNextCueNumber(1.9, [1.9, 2])).toBe(1.91);
      });

      it('uses 0.001 when 0.01 would exceed next cue', () => {
        // Cues 1.99, 2 - duplicate 1.99 should give 1.991 (not 2.0)
        expect(calculateNextCueNumber(1.99, [1.99, 2])).toBe(1.991);
      });

      it('uses smaller increments for tight spaces', () => {
        // Cues 1.1, 1.2 - duplicate 1.1 should give 1.11 (not 1.2)
        expect(calculateNextCueNumber(1.1, [1.1, 1.2])).toBe(1.11);
        // Cues 1.11, 1.12 - duplicate 1.11 should give 1.111
        expect(calculateNextCueNumber(1.11, [1.11, 1.12])).toBe(1.111);
      });
    });

    describe('no next cue (last cue)', () => {
      it('adds 1 when duplicating the last cue', () => {
        expect(calculateNextCueNumber(3, [1, 2, 3])).toBe(4);
        expect(calculateNextCueNumber(10.5, [10, 10.5])).toBe(11.5);
      });
    });

    describe('floating-point precision', () => {
      it('avoids floating-point errors like 10.299999999999999', () => {
        // This was the original bug - 10.2 + 0.1 = 10.299999999999999
        expect(calculateNextCueNumber(10.2, [10, 10.1, 10.2, 11])).toBe(10.3);
      });

      it('handles repeated duplications without precision loss', () => {
        let cues = [1, 2, 3];
        let current = 1;
        const expected = [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9];

        // Simulate repeated duplications: 1 -> 1.1 -> 1.2 -> ... -> 1.9
        for (let i = 0; i < 9; i++) {
          const newNumber = calculateNextCueNumber(current, cues);
          expect(newNumber).toBe(expected[i]);
          cues = [...cues, newNumber].sort((a, b) => a - b);
          current = newNumber;
        }

        // At 1.9, next duplicate should be 1.91
        const afterNine = calculateNextCueNumber(1.9, cues);
        expect(afterNine).toBe(1.91);
      });
    });

    describe('edge cases', () => {
      it('handles single cue', () => {
        expect(calculateNextCueNumber(1, [1])).toBe(2);
      });

      it('handles empty array gracefully', () => {
        expect(calculateNextCueNumber(1, [])).toBe(2);
      });

      it('handles very large cue numbers', () => {
        expect(calculateNextCueNumber(999, [999, 1000])).toBe(999.1);
      });

      it('handles cue number 0', () => {
        expect(calculateNextCueNumber(0, [0, 1])).toBe(0.1);
      });

      it('handles negative cue numbers', () => {
        expect(calculateNextCueNumber(-1, [-1, 0])).toBe(-0.9);
      });
    });

    describe('real-world scenarios', () => {
      it('handles typical show cue list', () => {
        const cues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        // Duplicate cue 5 - should insert 5.1
        expect(calculateNextCueNumber(5, cues)).toBe(5.1);

        // Now with 5.1 added, duplicate 5.1 - should insert 5.2
        expect(calculateNextCueNumber(5.1, [...cues, 5.1])).toBe(5.2);
      });

      it('handles inserting between existing point cues', () => {
        const cues = [1, 1.5, 2];

        // Duplicate 1 - should give 1.1 (before 1.5)
        expect(calculateNextCueNumber(1, cues)).toBe(1.1);

        // Duplicate 1.5 - should give 1.6 (before 2)
        expect(calculateNextCueNumber(1.5, cues)).toBe(1.6);
      });
    });
  });
});
