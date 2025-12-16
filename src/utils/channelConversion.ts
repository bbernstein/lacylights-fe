import { ChannelValue } from '@/types';

/**
 * Convert sparse channel array to dense array for display/editing
 * @param channels Sparse array of {offset, value}
 * @param channelCount Total number of channels in the fixture
 * @returns Dense array with values at each index
 */
export function sparseToDense(channels: ChannelValue[], channelCount: number): number[] {
  const dense = new Array(channelCount).fill(0);
  channels.forEach((ch) => {
    if (ch.offset >= 0 && ch.offset < channelCount) {
      dense[ch.offset] = ch.value;
    }
  });
  return dense;
}

/**
 * Convert dense array to sparse format for saving
 * @param values Dense array of channel values
 * @returns Sparse array containing all channel values (including zeros)
 *
 * Note: We include zero values because scenes need to be able to explicitly set channels to zero.
 * When fading to a scene, only channels present in the sparse array are faded. Omitting zeros
 * would cause those channels to retain their previous values instead of fading to zero.
 */
export function denseToSparse(values: number[]): ChannelValue[] {
  return values.map((value, offset) => ({ offset, value }));
}

/**
 * Convert sparse channel array to a Map for O(1) lookups
 * Use this when you need to look up multiple channels from the same sparse array.
 * For single lookups, use getChannelValue instead.
 * @param channels Sparse array of channel values
 * @returns Map from offset to value
 */
export function sparseArrayToMap(channels: ChannelValue[]): Map<number, number> {
  const map = new Map<number, number>();
  channels.forEach((ch) => {
    map.set(ch.offset, ch.value);
  });
  return map;
}

/**
 * Get value for a specific channel offset from sparse array
 * For single lookups, this is fine. For multiple lookups from the same array,
 * use sparseArrayToMap first for better performance.
 * If there are duplicate offsets, returns the last value (matching Map.set behavior).
 * @param channels Sparse array of channel values
 * @param offset Channel offset to look up
 * @returns Channel value or 0 if not found
 */
export function getChannelValue(channels: ChannelValue[], offset: number): number {
  // Iterate from end to match Map.set behavior (last value wins for duplicates)
  for (let i = channels.length - 1; i >= 0; i--) {
    if (channels[i].offset === offset) {
      return channels[i].value;
    }
  }
  return 0;
}

/**
 * Update a single channel value in a sparse array
 * @param channels Current sparse channel array
 * @param offset Channel offset to update
 * @param value New value
 * @returns New sparse array with updated value
 *
 * Note: We always include the value even if it's zero, because scenes need to be able
 * to explicitly set channels to zero for proper fade behavior.
 */
export function updateChannelValue(
  channels: ChannelValue[],
  offset: number,
  value: number
): ChannelValue[] {
  // Remove the channel if it exists
  const filtered = channels.filter((ch) => ch.offset !== offset);

  // Always add the value (including zero) to support blackout scenes
  filtered.push({ offset, value });

  // Sort by offset for consistency
  return filtered.sort((a, b) => a.offset - b.offset);
}
