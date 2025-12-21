/**
 * Unit tests for color matching utilities
 */

import {
  calculateColorDistance,
  calculateColorSimilarity,
  findMatchingRoscolux,
  getBestMatchingRoscolux,
} from '../colorMatching';
import { ROSCOLUX_FILTERS } from '@/data/roscoluxFilters';

describe('calculateColorDistance', () => {
  it('returns 0 for identical colors', () => {
    const color = { r: 100, g: 150, b: 200 };
    expect(calculateColorDistance(color, color)).toBe(0);
  });

  it('calculates correct Euclidean distance for pure red difference', () => {
    const distance = calculateColorDistance(
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 0, b: 0 }
    );
    expect(distance).toBe(255);
  });

  it('calculates correct Euclidean distance for pure green difference', () => {
    const distance = calculateColorDistance(
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 100, b: 0 }
    );
    expect(distance).toBe(100);
  });

  it('calculates correct Euclidean distance for pure blue difference', () => {
    const distance = calculateColorDistance(
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 50 }
    );
    expect(distance).toBe(50);
  });

  it('handles maximum distance (black to white)', () => {
    const distance = calculateColorDistance(
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 }
    );
    expect(distance).toBeCloseTo(441.67, 1);
  });

  it('calculates combined RGB distance correctly', () => {
    const distance = calculateColorDistance(
      { r: 100, g: 100, b: 100 },
      { r: 103, g: 104, b: 100 }
    );
    // sqrt(3^2 + 4^2 + 0^2) = sqrt(25) = 5
    expect(distance).toBe(5);
  });
});

describe('calculateColorSimilarity', () => {
  it('returns 100% for identical colors', () => {
    const color = { r: 100, g: 100, b: 100 };
    expect(calculateColorSimilarity(color, color)).toBe(100);
  });

  it('returns 0% for maximum distance (black to white)', () => {
    const similarity = calculateColorSimilarity(
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 }
    );
    expect(similarity).toBeCloseTo(0, 0);
  });

  it('returns intermediate values for similar colors', () => {
    const similarity = calculateColorSimilarity(
      { r: 100, g: 100, b: 100 },
      { r: 110, g: 110, b: 110 }
    );
    // Distance is sqrt(10^2 + 10^2 + 10^2) = sqrt(300) ≈ 17.32
    // Max distance is ~441.67
    // Similarity = (1 - 17.32/441.67) * 100 ≈ 96.08%
    expect(similarity).toBeGreaterThan(95);
    expect(similarity).toBeLessThan(97);
  });

  it('never returns values below 0%', () => {
    // Even for colors that are very different
    const similarity = calculateColorSimilarity(
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 }
    );
    expect(similarity).toBeGreaterThanOrEqual(0);
  });

  it('never returns values above 100%', () => {
    const similarity = calculateColorSimilarity(
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 }
    );
    expect(similarity).toBeLessThanOrEqual(100);
  });
});

describe('findMatchingRoscolux', () => {
  it('finds matches above threshold', () => {
    // Pure white should match R00 Clear or similar white filters
    const matches = findMatchingRoscolux(
      { r: 255, g: 255, b: 255 },
      ROSCOLUX_FILTERS,
      90
    );

    expect(matches.length).toBeGreaterThan(0);
    matches.forEach(match => {
      expect(match.similarity).toBeGreaterThanOrEqual(90);
    });
  });

  it('returns empty array when no matches meet threshold', () => {
    // Very specific color unlikely to match any Roscolux filter at 99.9% threshold
    const matches = findMatchingRoscolux(
      { r: 123, g: 45, b: 67 },
      ROSCOLUX_FILTERS,
      99.9
    );
    expect(matches.length).toBe(0);
  });

  it('sorts matches by similarity (best first)', () => {
    const matches = findMatchingRoscolux(
      { r: 255, g: 240, b: 220 },
      ROSCOLUX_FILTERS,
      90
    );

    if (matches.length > 1) {
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].similarity).toBeGreaterThanOrEqual(matches[i + 1].similarity);
      }
    }
  });

  it('respects threshold parameter', () => {
    const lowThreshold = findMatchingRoscolux(
      { r: 200, g: 150, b: 100 },
      ROSCOLUX_FILTERS,
      80
    );
    const highThreshold = findMatchingRoscolux(
      { r: 200, g: 150, b: 100 },
      ROSCOLUX_FILTERS,
      98
    );

    expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
  });

  it('includes all filter properties plus similarity', () => {
    const matches = findMatchingRoscolux(
      { r: 255, g: 255, b: 255 },
      ROSCOLUX_FILTERS,
      95
    );

    if (matches.length > 0) {
      const match = matches[0];
      expect(match).toHaveProperty('filter');
      expect(match).toHaveProperty('applications');
      expect(match).toHaveProperty('keywords');
      expect(match).toHaveProperty('rgbHex');
      expect(match).toHaveProperty('rgbDecimal');
      expect(match).toHaveProperty('similarity');
      expect(typeof match.similarity).toBe('number');
    }
  });
});

describe('getBestMatchingRoscolux', () => {
  it('returns best match when available', () => {
    const best = getBestMatchingRoscolux(
      { r: 255, g: 255, b: 255 },
      ROSCOLUX_FILTERS,
      90
    );

    expect(best).not.toBeNull();
    if (best) {
      expect(best.similarity).toBeGreaterThanOrEqual(90);
    }
  });

  it('returns null when no match meets threshold', () => {
    const best = getBestMatchingRoscolux(
      { r: 123, g: 45, b: 67 },
      ROSCOLUX_FILTERS,
      99.9
    );

    expect(best).toBeNull();
  });

  it('returns the highest similarity match', () => {
    const best = getBestMatchingRoscolux(
      { r: 255, g: 200, b: 150 },
      ROSCOLUX_FILTERS,
      90
    );

    const all = findMatchingRoscolux(
      { r: 255, g: 200, b: 150 },
      ROSCOLUX_FILTERS,
      90
    );

    if (best && all.length > 0) {
      expect(best.similarity).toBe(all[0].similarity);
    }
  });

  it('handles empty filter array', () => {
    const best = getBestMatchingRoscolux(
      { r: 255, g: 255, b: 255 },
      [],
      95
    );

    expect(best).toBeNull();
  });

  it('includes all filter properties', () => {
    const best = getBestMatchingRoscolux(
      { r: 255, g: 255, b: 255 },
      ROSCOLUX_FILTERS,
      90
    );

    if (best) {
      expect(best).toHaveProperty('filter');
      expect(best).toHaveProperty('applications');
      expect(best).toHaveProperty('keywords');
      expect(best).toHaveProperty('rgbHex');
      expect(best).toHaveProperty('rgbDecimal');
      expect(best).toHaveProperty('similarity');
    }
  });
});
