import { ChannelType } from '@/types';

/**
 * Discrete channel types where each DMX value has a specific meaning
 * (e.g., gobo selection, color wheel position). These always display as raw DMX.
 */
const DISCRETE_CHANNEL_TYPES = new Set<ChannelType>([
  ChannelType.GOBO,
  ChannelType.COLOR_WHEEL,
  ChannelType.EFFECT,
  ChannelType.MACRO,
  ChannelType.OTHER,
]);

/**
 * Check if a channel type represents a continuous range suitable for percentage display.
 * Discrete channels (gobo, color wheel, effect, macro, other) always show raw DMX.
 */
export function isPercentageChannel(channelType: ChannelType): boolean {
  return !DISCRETE_CHANNEL_TYPES.has(channelType);
}

/**
 * Convert a DMX value to a percentage (0.0-100.0).
 * Supports custom min/max ranges for channels with non-standard bounds.
 */
export function dmxToPercent(dmxValue: number, min = 0, max = 255): number {
  const range = max - min;
  if (range === 0) return 0;
  const percent = ((dmxValue - min) / range) * 100;
  return Math.max(0, Math.min(100, percent));
}

/**
 * Convert a percentage (0.0-100.0) to a DMX value, rounded and clamped.
 * Supports custom min/max ranges for channels with non-standard bounds.
 */
export function percentToDmx(percent: number, min = 0, max = 255): number {
  const range = max - min;
  const raw = min + (percent / 100) * range;
  return Math.round(Math.max(min, Math.min(max, raw)));
}

/**
 * Format a DMX value as a percentage string with one decimal place.
 */
export function formatPercent(dmxValue: number, min = 0, max = 255): string {
  return `${dmxToPercent(dmxValue, min, max).toFixed(1)}%`;
}

/**
 * Format a DMX value as a plain integer string.
 */
export function formatDmx(dmxValue: number): string {
  return String(Math.round(dmxValue));
}

/**
 * Get the step size for percentage mode input.
 * @param shiftHeld - true when shift key is held (finer control in percent mode)
 * @returns Step size in percentage units
 */
export function percentStep(shiftHeld: boolean): number {
  return shiftHeld ? 0.1 : 1.0;
}

/**
 * Get the step size for DMX mode input.
 * Note: In DMX mode, Shift = larger steps (coarser). In percent mode, Shift = smaller steps (finer).
 * @param shiftHeld - true when shift key is held
 * @returns Step size in DMX units
 */
export function dmxStep(shiftHeld: boolean): number {
  return shiftHeld ? 10 : 1;
}
