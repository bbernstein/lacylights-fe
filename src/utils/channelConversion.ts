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
    if (ch.offset < channelCount) {
      dense[ch.offset] = ch.value;
    }
  });
  return dense;
}

/**
 * Convert dense array to sparse format for saving
 * @param values Dense array of channel values
 * @returns Sparse array containing only non-zero values
 */
export function denseToSparse(values: number[]): ChannelValue[] {
  return values
    .map((value, offset) => ({ offset, value }))
    .filter((ch) => ch.value !== 0);
}

/**
 * Get value for a specific channel offset from sparse array
 * @param channels Sparse array of channel values
 * @param offset Channel offset to look up
 * @returns Channel value or 0 if not found
 */
export function getChannelValue(channels: ChannelValue[], offset: number): number {
  const channel = channels.find((ch) => ch.offset === offset);
  return channel ? channel.value : 0;
}

/**
 * Update a single channel value in a sparse array
 * @param channels Current sparse channel array
 * @param offset Channel offset to update
 * @param value New value
 * @returns New sparse array with updated value
 */
export function updateChannelValue(
  channels: ChannelValue[],
  offset: number,
  value: number
): ChannelValue[] {
  // Remove the channel if it exists
  const filtered = channels.filter((ch) => ch.offset !== offset);

  // Add it back if the value is non-zero
  if (value !== 0) {
    filtered.push({ offset, value });
  }

  // Sort by offset for consistency
  return filtered.sort((a, b) => a.offset - b.offset);
}
