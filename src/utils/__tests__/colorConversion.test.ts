import {
  rgbToChannelValues,
  channelValuesToRgb,
  applyIntensityToRgb,
  getFixtureColorType,
  createOptimizedColorMapping,
  RGBColor,
  COLOR_CHANNEL_TYPES,
  WHITE_CHANNEL_INTENSITY_FACTOR,

  AMBER_COLOR_RATIOS,

  UV_COLOR_HEX,
  UV_ACTIVATION_THRESHOLDS,
} from '../colorConversion';
import { ChannelType, FadeBehavior } from '@/types';

describe('colorConversion', () => {
  const mockChannels = [
    { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: '4', type: ChannelType.WHITE, value: 0, offset: 3, name: 'White', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: '5', type: ChannelType.AMBER, value: 0, offset: 4, name: 'Amber', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: '6', type: ChannelType.UV, value: 0, offset: 5, name: 'UV', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
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
    it('converts channel values back to RGB without INTENSITY channel', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 255, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];

      const result = channelValuesToRgb(channels);
      expect(result).toEqual({ r: 255, g: 0, b: 0, intensity: 1.0 });
    });

    it('handles white channel contribution', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.WHITE, value: 255, offset: 3, name: 'White', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];

      const result = channelValuesToRgb(channels);
      expect(result.r).toBeGreaterThan(0);
      expect(result.g).toBeGreaterThan(0);
      expect(result.b).toBeGreaterThan(0);
      expect(result.intensity).toBe(1.0);
    });

    it('returns black for empty channels', () => {
      const result = channelValuesToRgb([]);
      expect(result).toEqual({ r: 0, g: 0, b: 0, intensity: 1.0 });
    });

    it('returns unscaled RGB with INTENSITY channel at 50%', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 255, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.INTENSITY, value: 128, offset: 3, name: 'Intensity', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];

      const result = channelValuesToRgb(channels);
      // RGB should be unscaled (not multiplied by intensity)
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
      // Intensity should be normalized to 0-1 range
      expect(result.intensity).toBeCloseTo(0.5, 2);
    });

    it('returns unscaled RGB with INTENSITY channel at 0%', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 255, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 128, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 64, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.INTENSITY, value: 0, offset: 3, name: 'Intensity', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];

      const result = channelValuesToRgb(channels);
      // RGB should remain unscaled even when intensity is 0
      expect(result.r).toBe(255);
      expect(result.g).toBe(128);
      expect(result.b).toBe(64);
      expect(result.intensity).toBe(0);
    });

    it('returns unscaled RGB with INTENSITY channel at 100%', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 200, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 100, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 50, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.INTENSITY, value: 255, offset: 3, name: 'Intensity', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];

      const result = channelValuesToRgb(channels);
      // RGB should be unscaled
      expect(result.r).toBe(200);
      expect(result.g).toBe(100);
      expect(result.b).toBe(50);
      expect(result.intensity).toBe(1.0);
    });

    it('correctly calculates display color by multiplying unscaled RGB by intensity', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 255, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.INTENSITY, value: 128, offset: 3, name: 'Intensity', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];

      const { r, g, b, intensity } = channelValuesToRgb(channels);

      // Verify unscaled values
      expect(r).toBe(255);
      expect(g).toBe(0);
      expect(b).toBe(0);
      expect(intensity).toBeCloseTo(0.5, 2);

      // Calculate display color
      const displayR = Math.round(r * intensity);
      const displayG = Math.round(g * intensity);
      const displayB = Math.round(b * intensity);

      // Display color should be half of unscaled (50% intensity)
      expect(displayR).toBe(128);
      expect(displayG).toBe(0);
      expect(displayB).toBe(0);
    });

    it('handles RGB+I fixture with WHITE channel correctly', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 100, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.WHITE, value: 200, offset: 3, name: 'White', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '5', type: ChannelType.INTENSITY, value: 192, offset: 4, name: 'Intensity', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];

      const result = channelValuesToRgb(channels);

      // RGB should include white contribution but NOT be scaled by intensity
      expect(result.r).toBeGreaterThan(100);
      expect(result.g).toBeGreaterThan(0);
      expect(result.b).toBeGreaterThan(0);

      // Intensity should be 192/255 = 0.753
      expect(result.intensity).toBeCloseTo(0.753, 2);
    });
  });

  describe('applyIntensityToRgb', () => {
    it('applies intensity scaling correctly at 50%', () => {
      const rgb = { r: 255, g: 100, b: 50, intensity: 0.5 };
      const result = applyIntensityToRgb(rgb);

      expect(result.r).toBe(128);
      expect(result.g).toBe(50);
      expect(result.b).toBe(25);
    });

    it('returns unscaled RGB when intensity is 1.0', () => {
      const rgb = { r: 200, g: 150, b: 100, intensity: 1.0 };
      const result = applyIntensityToRgb(rgb);

      expect(result.r).toBe(200);
      expect(result.g).toBe(150);
      expect(result.b).toBe(100);
    });

    it('returns black when intensity is 0', () => {
      const rgb = { r: 255, g: 255, b: 255, intensity: 0 };
      const result = applyIntensityToRgb(rgb);

      expect(result.r).toBe(0);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('rounds fractional values correctly', () => {
      const rgb = { r: 100, g: 100, b: 100, intensity: 0.33 };
      const result = applyIntensityToRgb(rgb);

      // 100 * 0.33 = 33, Math.round(33) = 33
      expect(result.r).toBe(33);
      expect(result.g).toBe(33);
      expect(result.b).toBe(33);
    });

    it('handles various intensity levels', () => {
      const rgb = { r: 200, g: 0, b: 100, intensity: 0.75 };
      const result = applyIntensityToRgb(rgb);

      expect(result.r).toBe(150); // 200 * 0.75 = 150
      expect(result.g).toBe(0);   // 0 * 0.75 = 0
      expect(result.b).toBe(75);  // 100 * 0.75 = 75
    });
  });

  describe('getFixtureColorType', () => {
    it('identifies RGB fixtures', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];

      const result = getFixtureColorType(channels);
      expect(result).toBe('RGB');
    });

    it('identifies RGBW fixtures', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.WHITE, value: 0, offset: 3, name: 'White', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
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
        { id: '1', type: ChannelType.INTENSITY, value: 0, offset: 0, name: 'Intensity', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
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
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
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

  describe('intelligent color mapping (rgbToChannelValuesIntelligent)', () => {
    it('handles pure red color', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];
      const result = createOptimizedColorMapping({ r: 255, g: 0, b: 0 }, channels, 1.0);
      expect(result['1']).toBe(255);
      expect(result['2']).toBe(0);
      expect(result['3']).toBe(0);
    });

    it('utilizes CYAN channel for cyan colors', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.CYAN, value: 0, offset: 3, name: 'Cyan', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];
      const result = createOptimizedColorMapping({ r: 0, g: 255, b: 255 }, channels, 1.0);
      expect(result['4']).toBeGreaterThan(0); // Cyan channel should be utilized
    });

    it('utilizes MAGENTA channel for magenta colors', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.MAGENTA, value: 0, offset: 3, name: 'Magenta', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];
      const result = createOptimizedColorMapping({ r: 255, g: 0, b: 255 }, channels, 1.0);
      expect(result['4']).toBeGreaterThan(0); // Magenta channel should be utilized
    });

    it('utilizes YELLOW channel for yellow colors', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.YELLOW, value: 0, offset: 3, name: 'Yellow', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];
      const result = createOptimizedColorMapping({ r: 255, g: 255, b: 0 }, channels, 1.0);
      expect(result['4']).toBeGreaterThan(0); // Yellow channel should be utilized
    });

    it('handles white color with WHITE channel', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '4', type: ChannelType.WHITE, value: 0, offset: 3, name: 'White', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];
      const result = createOptimizedColorMapping({ r: 255, g: 255, b: 255 }, channels, 1.0);
      expect(result['4']).toBeGreaterThan(0); // White channel should be utilized
    });

    it('respects intensity parameter', () => {
      const channels = [
        { id: '1', type: ChannelType.RED, value: 0, offset: 0, name: 'Red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '2', type: ChannelType.GREEN, value: 0, offset: 1, name: 'Green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: '3', type: ChannelType.BLUE, value: 0, offset: 2, name: 'Blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ];
      const fullIntensity = createOptimizedColorMapping({ r: 255, g: 0, b: 0 }, channels, 1.0);
      const halfIntensity = createOptimizedColorMapping({ r: 255, g: 0, b: 0 }, channels, 0.5);
      expect(halfIntensity['1']).toBeLessThan(fullIntensity['1']);
    });
  });
});