import { rgbToHex, hexToRgb } from '../colorHelpers';

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
});