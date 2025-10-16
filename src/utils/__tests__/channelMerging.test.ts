import {
  mergeFixtureChannels,
  getMergedRGBColor,
  rgbToHex,
  hexToRgb,
  sortMergedChannels,
  getPriorityChannelTypes,
  MergedChannel,
} from '../channelMerging';
import { FixtureInstance, ChannelType, FixtureType } from '@/types';

describe('channelMerging', () => {
  const createMockFixture = (id: string, channels: unknown[]): FixtureInstance => ({
    id,
    name: `Fixture ${id}`,
    definitionId: 'def1',
    manufacturer: 'Test',
    model: 'Test',
    type: FixtureType.LED_PAR,
    modeName: 'Test Mode',
    channelCount: channels.length,
    channels: channels as FixtureInstance['channels'],
    project: {} as FixtureInstance['project'],
    universe: 1,
    startChannel: 1,
    tags: [],
    createdAt: '2024-01-01',
  });

  describe('mergeFixtureChannels', () => {
    it('should merge channels from multiple fixtures', () => {
      const fixture1 = createMockFixture('f1', [
        { id: 'c1', name: 'Intensity', type: ChannelType.INTENSITY, offset: 0, minValue: 0, maxValue: 255, defaultValue: 0 },
        { id: 'c2', name: 'Red', type: ChannelType.RED, offset: 1, minValue: 0, maxValue: 255, defaultValue: 0 },
      ]);
      const fixture2 = createMockFixture('f2', [
        { id: 'c3', name: 'Intensity', type: ChannelType.INTENSITY, offset: 0, minValue: 0, maxValue: 255, defaultValue: 0 },
        { id: 'c4', name: 'Red', type: ChannelType.RED, offset: 1, minValue: 0, maxValue: 255, defaultValue: 0 },
      ]);

      const fixtureValues = new Map([
        ['f1', [100, 200]],
        ['f2', [150, 200]],
      ]);

      const merged = mergeFixtureChannels([fixture1, fixture2], fixtureValues);

      expect(merged.size).toBe(2);

      const intensityChannel = merged.get(ChannelType.INTENSITY);
      expect(intensityChannel).toBeDefined();
      expect(intensityChannel?.fixtureIds).toEqual(['f1', 'f2']);
      expect(intensityChannel?.values).toEqual([100, 150]);
      expect(intensityChannel?.averageValue).toBe(125);
      expect(intensityChannel?.hasVariation).toBe(true);

      const redChannel = merged.get(ChannelType.RED);
      expect(redChannel).toBeDefined();
      expect(redChannel?.fixtureIds).toEqual(['f1', 'f2']);
      expect(redChannel?.values).toEqual([200, 200]);
      expect(redChannel?.averageValue).toBe(200);
      expect(redChannel?.hasVariation).toBe(false);
    });

    it('should handle fixtures with different channel sets', () => {
      const fixture1 = createMockFixture('f1', [
        { id: 'c1', name: 'Intensity', type: ChannelType.INTENSITY, offset: 0, minValue: 0, maxValue: 255, defaultValue: 0 },
        { id: 'c2', name: 'Red', type: ChannelType.RED, offset: 1, minValue: 0, maxValue: 255, defaultValue: 0 },
      ]);
      const fixture2 = createMockFixture('f2', [
        { id: 'c3', name: 'Pan', type: ChannelType.PAN, offset: 0, minValue: 0, maxValue: 255, defaultValue: 128 },
      ]);

      const fixtureValues = new Map([
        ['f1', [100, 200]],
        ['f2', [50]],
      ]);

      const merged = mergeFixtureChannels([fixture1, fixture2], fixtureValues);

      expect(merged.size).toBe(3);
      expect(merged.has(ChannelType.INTENSITY)).toBe(true);
      expect(merged.has(ChannelType.RED)).toBe(true);
      expect(merged.has(ChannelType.PAN)).toBe(true);

      const panChannel = merged.get(ChannelType.PAN);
      expect(panChannel?.fixtureIds).toEqual(['f2']);
      expect(panChannel?.values).toEqual([50]);
    });

    it('should use default values when channel values are missing', () => {
      const fixture1 = createMockFixture('f1', [
        { id: 'c1', name: 'Intensity', type: ChannelType.INTENSITY, offset: 0, minValue: 0, maxValue: 255, defaultValue: 100 },
      ]);

      const fixtureValues = new Map<string, number[]>();

      const merged = mergeFixtureChannels([fixture1], fixtureValues);

      const intensityChannel = merged.get(ChannelType.INTENSITY);
      expect(intensityChannel?.values).toEqual([100]);
      expect(intensityChannel?.averageValue).toBe(100);
    });

    it('should handle empty fixture list', () => {
      const merged = mergeFixtureChannels([], new Map());
      expect(merged.size).toBe(0);
    });
  });

  describe('getMergedRGBColor', () => {
    it('should return RGB color when all channels are present', () => {
      const mergedChannels = new Map([
        [ChannelType.RED, { averageValue: 255, type: ChannelType.RED } as MergedChannel],
        [ChannelType.GREEN, { averageValue: 128, type: ChannelType.GREEN } as MergedChannel],
        [ChannelType.BLUE, { averageValue: 64, type: ChannelType.BLUE } as MergedChannel],
      ]);

      const color = getMergedRGBColor(mergedChannels);
      expect(color).toEqual({ r: 255, g: 128, b: 64 });
    });

    it('should return null when RGB channels are missing', () => {
      const mergedChannels = new Map([
        [ChannelType.RED, { averageValue: 255, type: ChannelType.RED } as MergedChannel],
        [ChannelType.GREEN, { averageValue: 128, type: ChannelType.GREEN } as MergedChannel],
      ]);

      const color = getMergedRGBColor(mergedChannels);
      expect(color).toBeNull();
    });

    it('should return null for empty map', () => {
      const color = getMergedRGBColor(new Map());
      expect(color).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex correctly', () => {
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(255, 128, 64)).toBe('#ff8040');
    });

    it('should handle decimal values by rounding', () => {
      expect(rgbToHex(255.7, 128.3, 64.5)).toBe('#ff8041');
    });

    it('should pad single digit hex values', () => {
      expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f');
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex to RGB correctly', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ff8040')).toEqual({ r: 255, g: 128, b: 64 });
    });

    it('should handle hex without # prefix', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should handle uppercase hex', () => {
      expect(hexToRgb('#FF8040')).toEqual({ r: 255, g: 128, b: 64 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#xyz')).toBeNull();
      expect(hexToRgb('#ff')).toBeNull();
    });
  });

  describe('sortMergedChannels', () => {
    it('should sort channels by priority', () => {
      const channels: MergedChannel[] = [
        { name: 'Pan', type: ChannelType.PAN } as MergedChannel,
        { name: 'Intensity', type: ChannelType.INTENSITY } as MergedChannel,
        { name: 'Red', type: ChannelType.RED } as MergedChannel,
        { name: 'Blue', type: ChannelType.BLUE } as MergedChannel,
        { name: 'Green', type: ChannelType.GREEN } as MergedChannel,
      ];

      const sorted = sortMergedChannels(channels);

      expect(sorted[0].type).toBe(ChannelType.INTENSITY);
      expect(sorted[1].type).toBe(ChannelType.RED);
      expect(sorted[2].type).toBe(ChannelType.GREEN);
      expect(sorted[3].type).toBe(ChannelType.BLUE);
      expect(sorted[4].type).toBe(ChannelType.PAN);
    });

    it('should handle empty array', () => {
      const sorted = sortMergedChannels([]);
      expect(sorted).toEqual([]);
    });

    it('should not mutate original array', () => {
      const channels: MergedChannel[] = [
        { name: 'Pan', type: ChannelType.PAN } as MergedChannel,
        { name: 'Intensity', type: ChannelType.INTENSITY } as MergedChannel,
      ];

      const originalOrder = [...channels];
      sortMergedChannels(channels);

      expect(channels).toEqual(originalOrder);
    });
  });

  describe('getPriorityChannelTypes', () => {
    it('should return channel types in priority order', () => {
      const priorities = getPriorityChannelTypes();

      expect(priorities[0]).toBe(ChannelType.INTENSITY);
      expect(priorities[1]).toBe(ChannelType.RED);
      expect(priorities[2]).toBe(ChannelType.GREEN);
      expect(priorities[3]).toBe(ChannelType.BLUE);
    });

    it('should include all channel types', () => {
      const priorities = getPriorityChannelTypes();

      expect(priorities).toContain(ChannelType.INTENSITY);
      expect(priorities).toContain(ChannelType.RED);
      expect(priorities).toContain(ChannelType.GREEN);
      expect(priorities).toContain(ChannelType.BLUE);
      expect(priorities).toContain(ChannelType.WHITE);
      expect(priorities).toContain(ChannelType.AMBER);
      expect(priorities).toContain(ChannelType.UV);
      expect(priorities).toContain(ChannelType.PAN);
      expect(priorities).toContain(ChannelType.TILT);
      expect(priorities).toContain(ChannelType.OTHER);
    });
  });
});
