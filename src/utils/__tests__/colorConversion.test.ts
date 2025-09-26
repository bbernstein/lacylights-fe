import {
  rgbToChannelValues,
  channelValuesToRgb,
  getFixtureColorType,
  createOptimizedColorMapping,
  RGBColor,
  COLOR_CHANNEL_TYPES,
  WHITE_CHANNEL_INTENSITY_FACTOR,
  AMBER_BLUE_REDUCTION_FACTOR,
  AMBER_COLOR_RATIOS,
  UV_COLOR_FACTORS,
  UV_COLOR_HEX,
  UV_ACTIVATION_THRESHOLDS,
} from '../colorConversion';
import { ChannelType } from '@/types';

describe('colorConversion', () => {
  const mockChannels = [
    { id: '1', type: ChannelType.RED, value: 0 },
    { id: '2', type: ChannelType.GREEN, value: 0 },
    { id: '3', type: ChannelType.BLUE, value: 0 },
    { id: '4', type: ChannelType.WHITE, value: 0 },
    { id: '5', type: ChannelType.AMBER, value: 0 },
    { id: '6', type: ChannelType.UV, value: 0 },
  ];

  describe('rgbToChannelValues', () => {
    it('converts RGB to channel values', () => {
      const targetColor: RGBColor = { r: 255, g: 0, b: 0 };
      const result = rgbToChannelValues(targetColor, mockChannels);

      expect(result['1']).toBe(255); // Red channel
      expect(result['2']).toBe(0);   // Green channel
      expect(result['3']).toBe(0);   // Blue channel
    });

    it('handles white channel correctly', () => {
      const targetColor: RGBColor = { r: 255, g: 255, b: 255 };
      const result = rgbToChannelValues(targetColor, mockChannels);

      expect(result['4']).toBe(255); // White channel should be 255
    });

    it('calculates amber channel for yellow colors', () => {
      const targetColor: RGBColor = { r: 255, g: 255, b: 0 };
      const result = rgbToChannelValues(targetColor, mockChannels);

      expect(result['5']).toBeGreaterThan(0); // Amber channel should be active
    });

    it('handles empty channels array', () => {
      const targetColor: RGBColor = { r: 255, g: 0, b: 0 };
      const result = rgbToChannelValues(targetColor, []);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('channelValuesToRgb', () => {
    it('converts channel values back to RGB', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 255 },
        { id: '2', type: ChannelType.GREEN, value: 0 },
        { id: '3', type: ChannelType.BLUE, value: 0 },
      ];

      const result = channelValuesToRgb(channels);
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('handles white channel contribution', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0 },
        { id: '2', type: ChannelType.GREEN, value: 0 },
        { id: '3', type: ChannelType.BLUE, value: 0 },
        { id: '4', type: ChannelType.WHITE, value: 255 },
      ];

      const result = channelValuesToRgb(channels);
      expect(result.r).toBeGreaterThan(0);
      expect(result.g).toBeGreaterThan(0);
      expect(result.b).toBeGreaterThan(0);
    });

    it('returns black for empty channels', () => {
      const result = channelValuesToRgb([]);
      expect(result).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('getFixtureColorType', () => {
    it('identifies RGB fixtures', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0 },
        { id: '2', type: ChannelType.GREEN, value: 0 },
        { id: '3', type: ChannelType.BLUE, value: 0 },
      ];

      const result = getFixtureColorType(channels);
      expect(result).toBe('RGB');
    });

    it('identifies RGBW fixtures', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0 },
        { id: '2', type: ChannelType.GREEN, value: 0 },
        { id: '3', type: ChannelType.BLUE, value: 0 },
        { id: '4', type: ChannelType.WHITE, value: 0 },
      ];

      const result = getFixtureColorType(channels);
      expect(result).toBe('RGBW');
    });

    it('identifies RGBWAU fixtures', () => {
      const result = getFixtureColorType(mockChannels);
      expect(result).toBe('RGBWAU');
    });

    it('identifies SINGLE channel fixtures', () => {
      const channels = [
        { id: '1', type: ChannelType.INTENSITY, value: 0 },
      ];

      const result = getFixtureColorType(channels);
      expect(result).toBe('SINGLE');
    });
  });

  describe('createOptimizedColorMapping', () => {
    it('creates optimized mapping for advanced fixtures', () => {
      const targetColor: RGBColor = { r: 255, g: 128, b: 64 };
      const result = createOptimizedColorMapping(targetColor, mockChannels);

      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(result['1']).toBeDefined(); // Red channel
    });

    it('creates basic mapping for simple fixtures', () => {
      const simpleChannels = [
        { id: '1', type: ChannelType.RED, value: 0 },
        { id: '2', type: ChannelType.GREEN, value: 0 },
        { id: '3', type: ChannelType.BLUE, value: 0 },
      ];

      const targetColor: RGBColor = { r: 255, g: 128, b: 64 };
      const result = createOptimizedColorMapping(targetColor, simpleChannels);

      expect(result['1']).toBe(255);
      expect(result['2']).toBe(128);
      expect(result['3']).toBe(64);
    });
  });

  describe('constants', () => {
    it('exports color channel types', () => {
      expect(COLOR_CHANNEL_TYPES).toContain(ChannelType.RED);
      expect(COLOR_CHANNEL_TYPES).toContain(ChannelType.GREEN);
      expect(COLOR_CHANNEL_TYPES).toContain(ChannelType.BLUE);
    });

    it('exports white channel intensity factor', () => {
      expect(WHITE_CHANNEL_INTENSITY_FACTOR).toBe(0.95);
    });

    it('exports amber color ratios', () => {
      expect(AMBER_COLOR_RATIOS.GREEN_FACTOR).toBe(0.75);
    });

    it('exports UV color hex', () => {
      expect(UV_COLOR_HEX).toBe('#4b0082');
    });

    it('exports UV activation thresholds', () => {
      expect(UV_ACTIVATION_THRESHOLDS.MIN_BLUE).toBeDefined();
      expect(UV_ACTIVATION_THRESHOLDS.MAX_RED).toBeDefined();
    });
  });
});