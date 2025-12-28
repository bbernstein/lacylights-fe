import { rgbToHex, hexToRgb, getContrastingTextColor } from '../colorHelpers';

describe('colorHelpers', () => {
  describe('rgbToHex', () => {
    it('converts RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('handles intermediate values', () => {
      expect(rgbToHex(128, 128, 128)).toBe('#808080');
      expect(rgbToHex(64, 128, 192)).toBe('#4080c0');
    });

    it('clamps values to 0-255 range', () => {
      expect(rgbToHex(-10, 300, 128)).toBe('#00ff80');
    });

    it('handles decimal values by rounding', () => {
      expect(rgbToHex(127.4, 127.6, 127.9)).toBe('#7f8080');
    });
  });

  describe('hexToRgb', () => {
    it('converts 6-digit hex to RGB', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('handles lowercase hex', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('handles hex without # prefix', () => {
      expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('handles intermediate values', () => {
      expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 });
      expect(hexToRgb('#4080C0')).toEqual({ r: 64, g: 128, b: 192 });
    });

    it('converts 3-digit shorthand hex to RGB', () => {
      expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#0F0')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#00F')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('handles lowercase 3-digit hex', () => {
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('handles 3-digit hex without # prefix', () => {
      expect(hexToRgb('F00')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('0F0')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('converts intermediate 3-digit hex values', () => {
      expect(hexToRgb('#888')).toEqual({ r: 136, g: 136, b: 136 });
      expect(hexToRgb('#48C')).toEqual({ r: 68, g: 136, b: 204 });
    });

    it('returns black for invalid hex', () => {
      expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#GGGGGG')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#12345')).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('color conversion round-trip', () => {
    it('converts RGB to hex and back correctly', () => {
      const originalColor = { r: 128, g: 64, b: 192 };
      const hex = rgbToHex(originalColor.r, originalColor.g, originalColor.b);
      const convertedBack = hexToRgb(hex);

      expect(convertedBack).toEqual(originalColor);
    });

    it('handles edge cases in round-trip conversion', () => {
      const colors = [
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 },
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
      ];

      colors.forEach(color => {
        const hex = rgbToHex(color.r, color.g, color.b);
        const convertedBack = hexToRgb(hex);
        expect(convertedBack).toEqual(color);
      });
    });
  });

  describe('getContrastingTextColor', () => {
    it('returns dark grey for white background', () => {
      expect(getContrastingTextColor('#ffffff')).toBe('#1a1a1a');
      expect(getContrastingTextColor('#FFFFFF')).toBe('#1a1a1a');
    });

    it('returns light grey for black background', () => {
      expect(getContrastingTextColor('#000000')).toBe('#f5f5f5');
      expect(getContrastingTextColor('#000')).toBe('#f5f5f5');
    });

    it('returns dark grey for light backgrounds', () => {
      // Light yellow
      expect(getContrastingTextColor('#ffff99')).toBe('#1a1a1a');
      // Light cyan
      expect(getContrastingTextColor('#99ffff')).toBe('#1a1a1a');
      // Light pink
      expect(getContrastingTextColor('#ffccff')).toBe('#1a1a1a');
      // Light green
      expect(getContrastingTextColor('#ccffcc')).toBe('#1a1a1a');
    });

    it('returns light grey for dark backgrounds', () => {
      // Dark blue
      expect(getContrastingTextColor('#000080')).toBe('#f5f5f5');
      // Dark red
      expect(getContrastingTextColor('#800000')).toBe('#f5f5f5');
      // Dark green
      expect(getContrastingTextColor('#008000')).toBe('#f5f5f5');
      // Dark grey
      expect(getContrastingTextColor('#333333')).toBe('#f5f5f5');
    });

    it('handles medium brightness colors appropriately', () => {
      // Medium grey (luminance ~0.21, below threshold)
      expect(getContrastingTextColor('#808080')).toBe('#f5f5f5');
      // Medium blue (dark, low luminance)
      expect(getContrastingTextColor('#0000ff')).toBe('#f5f5f5');
      // Medium red (dark, low luminance)
      expect(getContrastingTextColor('#ff0000')).toBe('#f5f5f5');
      // Medium green (bright, high luminance due to green weight in formula)
      expect(getContrastingTextColor('#00ff00')).toBe('#1a1a1a');
    });

    it('handles 3-digit shorthand hex colors', () => {
      expect(getContrastingTextColor('#FFF')).toBe('#1a1a1a');
      expect(getContrastingTextColor('#000')).toBe('#f5f5f5');
      expect(getContrastingTextColor('#F00')).toBe('#f5f5f5');
      expect(getContrastingTextColor('#0F0')).toBe('#1a1a1a');
      expect(getContrastingTextColor('#00F')).toBe('#f5f5f5');
    });

    it('handles colors without # prefix', () => {
      expect(getContrastingTextColor('ffffff')).toBe('#1a1a1a');
      expect(getContrastingTextColor('000000')).toBe('#f5f5f5');
      expect(getContrastingTextColor('FFF')).toBe('#1a1a1a');
      expect(getContrastingTextColor('000')).toBe('#f5f5f5');
    });

    it('handles invalid colors gracefully', () => {
      // Invalid colors default to black (r:0, g:0, b:0) via hexToRgb
      expect(getContrastingTextColor('invalid')).toBe('#f5f5f5');
      expect(getContrastingTextColor('')).toBe('#f5f5f5');
      expect(getContrastingTextColor('#GGGGGG')).toBe('#f5f5f5');
    });
  });
});