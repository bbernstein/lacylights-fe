import {
  sparseToDense,
  denseToSparse,
  sparseArrayToMap,
  getChannelValue,
  updateChannelValue,
} from '../channelConversion';
import { ChannelValue } from '@/types';

describe('channelConversion', () => {
  describe('sparseToDense', () => {
    it('converts sparse array to dense array', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
        { offset: 4, value: 64 },
      ];
      const result = sparseToDense(sparse, 6);
      expect(result).toEqual([255, 0, 128, 0, 64, 0]);
    });

    it('handles empty sparse array', () => {
      const sparse: ChannelValue[] = [];
      const result = sparseToDense(sparse, 4);
      expect(result).toEqual([0, 0, 0, 0]);
    });

    it('handles channelCount of 0', () => {
      const sparse: ChannelValue[] = [{ offset: 0, value: 255 }];
      const result = sparseToDense(sparse, 0);
      expect(result).toEqual([]);
    });

    it('ignores out-of-bounds offsets', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
        { offset: 5, value: 128 }, // Out of bounds
      ];
      const result = sparseToDense(sparse, 3);
      expect(result).toEqual([255, 0, 0]);
    });

    it('ignores negative offsets', () => {
      const sparse: ChannelValue[] = [
        { offset: -1, value: 255 }, // Negative offset
        { offset: 0, value: 128 },
        { offset: 1, value: 64 },
      ];
      const result = sparseToDense(sparse, 3);
      expect(result).toEqual([128, 64, 0]);
    });

    it('handles duplicate offsets (last value wins)', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 100 },
        { offset: 0, value: 200 },
      ];
      const result = sparseToDense(sparse, 2);
      expect(result).toEqual([200, 0]);
    });
  });

  describe('denseToSparse', () => {
    it('converts dense array to sparse array', () => {
      const dense = [255, 0, 128, 0, 64, 0];
      const result = denseToSparse(dense);
      expect(result).toEqual([
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
        { offset: 4, value: 64 },
      ]);
    });

    it('handles all-zero dense array', () => {
      const dense = [0, 0, 0, 0];
      const result = denseToSparse(dense);
      expect(result).toEqual([]);
    });

    it('handles empty dense array', () => {
      const dense: number[] = [];
      const result = denseToSparse(dense);
      expect(result).toEqual([]);
    });

    it('includes all non-zero values', () => {
      const dense = [1, 2, 3, 4, 5];
      const result = denseToSparse(dense);
      expect(result).toEqual([
        { offset: 0, value: 1 },
        { offset: 1, value: 2 },
        { offset: 2, value: 3 },
        { offset: 3, value: 4 },
        { offset: 4, value: 5 },
      ]);
    });

    it('preserves value 255', () => {
      const dense = [255, 0, 255];
      const result = denseToSparse(dense);
      expect(result).toEqual([
        { offset: 0, value: 255 },
        { offset: 2, value: 255 },
      ]);
    });
  });

  describe('round-trip conversions', () => {
    it('sparse -> dense -> sparse preserves data', () => {
      const original: ChannelValue[] = [
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
        { offset: 4, value: 64 },
      ];
      const dense = sparseToDense(original, 6);
      const result = denseToSparse(dense);
      expect(result).toEqual(original);
    });

    it('dense -> sparse -> dense preserves data', () => {
      const original = [255, 0, 128, 0, 64, 0];
      const sparse = denseToSparse(original);
      const result = sparseToDense(sparse, original.length);
      expect(result).toEqual(original);
    });
  });

  describe('sparseArrayToMap', () => {
    it('converts sparse array to Map', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
        { offset: 4, value: 64 },
      ];
      const map = sparseArrayToMap(sparse);
      expect(map.get(0)).toBe(255);
      expect(map.get(2)).toBe(128);
      expect(map.get(4)).toBe(64);
      expect(map.get(1)).toBeUndefined();
      expect(map.size).toBe(3);
    });

    it('handles empty array', () => {
      const sparse: ChannelValue[] = [];
      const map = sparseArrayToMap(sparse);
      expect(map.size).toBe(0);
    });

    it('handles duplicate offsets (last value wins)', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 100 },
        { offset: 0, value: 200 },
      ];
      const map = sparseArrayToMap(sparse);
      expect(map.get(0)).toBe(200);
      expect(map.size).toBe(1);
    });
  });

  describe('getChannelValue', () => {
    it('returns value for existing offset', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
      ];
      expect(getChannelValue(sparse, 0)).toBe(255);
      expect(getChannelValue(sparse, 2)).toBe(128);
    });

    it('returns 0 for non-existing offset', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
      ];
      expect(getChannelValue(sparse, 1)).toBe(0);
      expect(getChannelValue(sparse, 5)).toBe(0);
    });

    it('returns 0 for empty array', () => {
      const sparse: ChannelValue[] = [];
      expect(getChannelValue(sparse, 0)).toBe(0);
    });

    it('returns last matching value for duplicates (matching Map behavior)', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 100 },
        { offset: 0, value: 200 },
      ];
      expect(getChannelValue(sparse, 0)).toBe(200);
    });
  });

  describe('updateChannelValue', () => {
    it('updates existing channel value', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
      ];
      const result = updateChannelValue(sparse, 0, 100);
      expect(result).toEqual([
        { offset: 0, value: 100 },
        { offset: 2, value: 128 },
      ]);
    });

    it('adds new channel value', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
      ];
      const result = updateChannelValue(sparse, 2, 128);
      expect(result).toEqual([
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
      ]);
    });

    it('removes channel when value is 0', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
      ];
      const result = updateChannelValue(sparse, 2, 0);
      expect(result).toEqual([
        { offset: 0, value: 255 },
      ]);
    });

    it('does nothing when setting non-existing channel to 0', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
      ];
      const result = updateChannelValue(sparse, 2, 0);
      expect(result).toEqual([
        { offset: 0, value: 255 },
      ]);
    });

    it('maintains sorted order by offset', () => {
      const sparse: ChannelValue[] = [
        { offset: 0, value: 255 },
        { offset: 4, value: 64 },
      ];
      const result = updateChannelValue(sparse, 2, 128);
      expect(result).toEqual([
        { offset: 0, value: 255 },
        { offset: 2, value: 128 },
        { offset: 4, value: 64 },
      ]);
    });

    it('handles empty array', () => {
      const sparse: ChannelValue[] = [];
      const result = updateChannelValue(sparse, 0, 255);
      expect(result).toEqual([
        { offset: 0, value: 255 },
      ]);
    });

    it('handles setting to 0 on empty array', () => {
      const sparse: ChannelValue[] = [];
      const result = updateChannelValue(sparse, 0, 0);
      expect(result).toEqual([]);
    });

    it('does not mutate original array', () => {
      const original: ChannelValue[] = [
        { offset: 0, value: 255 },
      ];
      const copy = [...original];
      updateChannelValue(original, 0, 100);
      expect(original).toEqual(copy);
    });
  });
});
