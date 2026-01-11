/**
 * Utility functions for cue list operations
 */

/**
 * Converts a cue index that might be null or undefined to a local state index.
 * Returns -1 for null/undefined values, which represents "no cue selected" state.
 *
 * @param index - The cue index from the API (can be null, undefined, or number)
 * @returns A number representing the local state index (-1 for no selection)
 */
export const convertCueIndexForLocalState = (index: number | null | undefined): number => {
  return index !== undefined && index !== null ? index : -1;
};

/**
 * Rounds a number to a specific decimal precision to avoid floating-point issues.
 *
 * @param num - The number to round
 * @param precision - Number of decimal places
 * @returns The rounded number
 */
const roundToPrecision = (num: number, precision: number): number => {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
};

/**
 * Calculates the next cue number when inserting a new cue after a given cue.
 * This handles floating-point precision issues and finds a clean number that
 * fits between the current cue and the next one.
 *
 * Examples:
 * - Current: 1, Next: 2 → Returns 1.1
 * - Current: 1.1, Next: 2 → Returns 1.2
 * - Current: 1.9, Next: 2 → Returns 1.91
 * - Current: 1.99, Next: 2 → Returns 1.991
 * - Current: 1.1, Next: 1.2 → Returns 1.11
 *
 * @param currentCueNumber - The cue number being duplicated/inserted after
 * @param allCueNumbers - Array of all existing cue numbers in the cue list
 * @returns A new cue number that fits after the current one
 */
export const calculateNextCueNumber = (
  currentCueNumber: number,
  allCueNumbers: number[]
): number => {
  // Sort and find the next cue number that is greater than current
  const sortedNumbers = [...allCueNumbers].sort((a, b) => a - b);
  const nextCueNumber = sortedNumbers.find((n) => n > currentCueNumber) ?? null;

  // If no next cue, just add 1
  if (nextCueNumber === null) {
    return roundToPrecision(currentCueNumber + 1, 4);
  }

  // Try increments: 0.1, 0.01, 0.001, 0.0001
  const increments = [0.1, 0.01, 0.001, 0.0001];

  for (const increment of increments) {
    // Determine precision based on the increment (0.1 → 1 decimal, 0.01 → 2, etc.)
    const precision = Math.round(-Math.log10(increment));
    const candidate = roundToPrecision(currentCueNumber + increment, precision);

    if (candidate < nextCueNumber) {
      return candidate;
    }
  }

  // Fallback: use midpoint between current and next (very tight space)
  return roundToPrecision((currentCueNumber + nextCueNumber) / 2, 4);
};