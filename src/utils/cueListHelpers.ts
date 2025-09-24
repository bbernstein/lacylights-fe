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