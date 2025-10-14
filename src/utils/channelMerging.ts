/**
 * Utilities for merging channels from multiple selected fixtures
 * Used for group control of fixtures in 2D layout editor
 */

import { FixtureInstance, InstanceChannel, ChannelType } from '@/types';

/**
 * Represents a merged channel across multiple fixtures
 */
export interface MergedChannel {
  name: string;              // Channel name (e.g., "Red", "Intensity")
  type: ChannelType;          // Channel type
  fixtureIds: string[];      // IDs of fixtures that have this channel
  channelIndices: number[];  // Channel index within each fixture (same order as fixtureIds)
  values: number[];          // Current values for each fixture (0-255)
  averageValue: number;      // Average value across all fixtures
  hasVariation: boolean;     // True if values differ across fixtures
  minValue: number;          // Minimum allowed value (usually 0)
  maxValue: number;          // Maximum allowed value (usually 255)
}

/**
 * Merge channels from multiple selected fixtures
 * Returns a map of channel name -> merged channel data
 */
export function mergeFixtureChannels(
  selectedFixtures: FixtureInstance[],
  fixtureValues: Map<string, number[]>
): Map<string, MergedChannel> {
  const channelMap = new Map<string, MergedChannel>();

  selectedFixtures.forEach(fixture => {
    const channels = fixture.channels || [];
    const values = fixtureValues.get(fixture.id) || [];

    channels.forEach((channel: InstanceChannel, index: number) => {
      const key = channel.type; // Use channel type as key to group similar channels

      if (!channelMap.has(key)) {
        channelMap.set(key, {
          name: channel.name,
          type: channel.type,
          fixtureIds: [],
          channelIndices: [],
          values: [],
          averageValue: 0,
          hasVariation: false,
          minValue: channel.minValue,
          maxValue: channel.maxValue,
        });
      }

      const mergedChannel = channelMap.get(key)!;
      mergedChannel.fixtureIds.push(fixture.id);
      mergedChannel.channelIndices.push(index);

      const value = values[index] ?? channel.defaultValue ?? 0;
      mergedChannel.values.push(value);
    });
  });

  // Calculate averages and detect variations
  channelMap.forEach(channel => {
    if (channel.values.length > 0) {
      channel.averageValue = channel.values.reduce((a, b) => a + b, 0) / channel.values.length;

      // Check if all values are the same
      const firstValue = channel.values[0];
      channel.hasVariation = !channel.values.every(v => Math.abs(v - firstValue) < 0.1);
    }
  });

  return channelMap;
}

/**
 * Get RGB color from merged channels
 * Returns average RGB values if available, otherwise null
 */
export function getMergedRGBColor(
  mergedChannels: Map<string, MergedChannel>
): { r: number; g: number; b: number } | null {
  const red = mergedChannels.get(ChannelType.RED);
  const green = mergedChannels.get(ChannelType.GREEN);
  const blue = mergedChannels.get(ChannelType.BLUE);

  if (!red || !green || !blue) {
    return null;
  }

  return {
    r: red.averageValue,
    g: green.averageValue,
    b: blue.averageValue,
  };
}

/**
 * Convert RGB values (0-255) to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => {
    // Clamp to 0-255 range and round
    const clamped = Math.max(0, Math.min(255, Math.round(value)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex color string to RGB values (0-255)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Get channel types that are priority for display
 * Returns channel types in order of importance
 */
export function getPriorityChannelTypes(): ChannelType[] {
  return [
    ChannelType.INTENSITY,
    ChannelType.RED,
    ChannelType.GREEN,
    ChannelType.BLUE,
    ChannelType.WHITE,
    ChannelType.AMBER,
    ChannelType.UV,
    ChannelType.PAN,
    ChannelType.TILT,
    ChannelType.ZOOM,
    ChannelType.FOCUS,
    ChannelType.IRIS,
    ChannelType.GOBO,
    ChannelType.COLOR_WHEEL,
    ChannelType.EFFECT,
    ChannelType.STROBE,
    ChannelType.MACRO,
    ChannelType.OTHER,
  ];
}

/**
 * Sort merged channels by priority
 */
export function sortMergedChannels(
  channels: MergedChannel[]
): MergedChannel[] {
  const priorityOrder = getPriorityChannelTypes();

  // Create a copy to avoid mutating the original array
  return [...channels].sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.type);
    const bIndex = priorityOrder.indexOf(b.type);
    return aIndex - bIndex;
  });
}
