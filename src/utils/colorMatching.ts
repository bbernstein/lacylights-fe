/**
 * Color matching utilities for finding Roscolux filters that match given RGB colors.
 *
 * This module provides functions to calculate color distances and find matching
 * theatrical gel filters from the Roscolux catalog based on RGB color values.
 */

import { RoscoluxFilter } from '@/data/roscoluxFilters';
import { hexToRgb } from './colorHelpers';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Calculate Euclidean color distance in RGB space.
 *
 * This is a simpler and faster alternative to Delta E 2000, providing
 * good results for basic color matching applications.
 *
 * @param color1 First RGB color (0-255)
 * @param color2 Second RGB color (0-255)
 * @returns Distance value from 0 (identical) to ~441 (maximum, e.g., black vs white)
 *
 * @example
 * const distance = calculateColorDistance(
 *   { r: 255, g: 0, b: 0 },
 *   { r: 255, g: 100, b: 0 }
 * );
 * console.log(distance); // ~100
 */
export function calculateColorDistance(color1: RGBColor, color2: RGBColor): number {
  const rDiff = color1.r - color2.r;
  const gDiff = color1.g - color2.g;
  const bDiff = color1.b - color2.b;

  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Calculate color similarity as a percentage (0-100%).
 *
 * Higher percentages indicate better matches:
 * - 100% = perfect match (identical colors)
 * - 95%+ = very close match
 * - 90%+ = good match
 * - <90% = poor match
 *
 * @param color1 First RGB color (0-255)
 * @param color2 Second RGB color (0-255)
 * @returns Similarity percentage from 0 (completely different) to 100 (identical)
 *
 * @example
 * const similarity = calculateColorSimilarity(
 *   { r: 255, g: 255, b: 255 },
 *   { r: 255, g: 255, b: 255 }
 * );
 * console.log(similarity); // 100
 */
export function calculateColorSimilarity(color1: RGBColor, color2: RGBColor): number {
  const maxDistance = Math.sqrt(255 * 255 * 3); // ~441.67
  const distance = calculateColorDistance(color1, color2);
  return Math.max(0, Math.min(100, (1 - distance / maxDistance) * 100));
}

/**
 * Find Roscolux filters matching a target color.
 *
 * Only returns filters that meet the similarity threshold, sorted by
 * similarity with the best match first.
 *
 * @param targetColor RGB color to match (0-255)
 * @param filters Array of Roscolux filters to search
 * @param threshold Minimum similarity percentage (0-100), default 95
 * @returns Array of matching filters with similarity scores, sorted by similarity (best first)
 *
 * @example
 * const matches = findMatchingRoscolux(
 *   { r: 255, g: 200, b: 150 },
 *   ROSCOLUX_FILTERS,
 *   90
 * );
 * matches.forEach(match => {
 *   console.log(`${match.filter}: ${match.similarity.toFixed(1)}%`);
 * });
 */
export function findMatchingRoscolux(
  targetColor: RGBColor,
  filters: RoscoluxFilter[],
  threshold: number = 95
): Array<RoscoluxFilter & { similarity: number }> {
  const matches = filters
    .map(filter => {
      const filterRgb = hexToRgb(filter.rgbHex);
      const similarity = calculateColorSimilarity(targetColor, filterRgb);
      return { ...filter, similarity };
    })
    .filter(match => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);

  return matches;
}

/**
 * Get the single best matching Roscolux filter.
 *
 * Returns null if no filter meets the threshold requirement.
 *
 * @param targetColor RGB color to match (0-255)
 * @param filters Array of Roscolux filters to search
 * @param threshold Minimum similarity percentage (0-100), default 95
 * @returns Best matching filter with similarity score, or null if no match meets threshold
 *
 * @example
 * const best = getBestMatchingRoscolux(
 *   { r: 255, g: 255, b: 255 },
 *   ROSCOLUX_FILTERS,
 *   95
 * );
 * if (best) {
 *   console.log(`Best match: ${best.filter} (${best.similarity.toFixed(1)}%)`);
 * } else {
 *   console.log('No close matches found');
 * }
 */
export function getBestMatchingRoscolux(
  targetColor: RGBColor,
  filters: RoscoluxFilter[],
  threshold: number = 95
): (RoscoluxFilter & { similarity: number }) | null {
  const matches = findMatchingRoscolux(targetColor, filters, threshold);
  return matches.length > 0 ? matches[0] : null;
}
