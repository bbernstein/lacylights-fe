import { rgbToHex, hexToRgb, rgbToHsb, hsbToRgb, getContrastingTextColor } from '../colorHelpers';

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

  describe('rgbToHsb', () => {
    it('converts primary colors correctly', () => {
      // Red
      expect(rgbToHsb(255, 0, 0)).toEqual({ hue: 0, saturation: 100, brightness: 100 });
      // Green
      expect(rgbToHsb(0, 255, 0)).toEqual({ hue: 120, saturation: 100, brightness: 100 });
      // Blue
      expect(rgbToHsb(0, 0, 255)).toEqual({ hue: 240, saturation: 100, brightness: 100 });
    });

    it('converts secondary colors correctly', () => {
      // Yellow
      expect(rgbToHsb(255, 255, 0)).toEqual({ hue: 60, saturation: 100, brightness: 100 });
      // Cyan
      expect(rgbToHsb(0, 255, 255)).toEqual({ hue: 180, saturation: 100, brightness: 100 });
      // Magenta
      expect(rgbToHsb(255, 0, 255)).toEqual({ hue: 300, saturation: 100, brightness: 100 });
    });

    it('converts white correctly', () => {
      expect(rgbToHsb(255, 255, 255)).toEqual({ hue: 0, saturation: 0, brightness: 100 });
    });

    it('converts black correctly', () => {
      expect(rgbToHsb(0, 0, 0)).toEqual({ hue: 0, saturation: 0, brightness: 0 });
    });

    it('converts grey values correctly', () => {
      // 50% grey
      expect(rgbToHsb(128, 128, 128)).toEqual({ hue: 0, saturation: 0, brightness: 50 });
    });

    it('converts intermediate colors', () => {
      // Orange-ish (hue ~30)
      const result = rgbToHsb(255, 128, 0);
      expect(result.hue).toBeGreaterThanOrEqual(29);
      expect(result.hue).toBeLessThanOrEqual(31);
      expect(result.saturation).toBe(100);
      expect(result.brightness).toBe(100);
    });
  });

  describe('hsbToRgb', () => {
    it('converts primary hues correctly', () => {
      // Red (hue 0)
      expect(hsbToRgb(0, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
      // Green (hue 120)
      expect(hsbToRgb(120, 100, 100)).toEqual({ r: 0, g: 255, b: 0 });
      // Blue (hue 240)
      expect(hsbToRgb(240, 100, 100)).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('converts secondary hues correctly', () => {
      // Yellow (hue 60)
      expect(hsbToRgb(60, 100, 100)).toEqual({ r: 255, g: 255, b: 0 });
      // Cyan (hue 180)
      expect(hsbToRgb(180, 100, 100)).toEqual({ r: 0, g: 255, b: 255 });
      // Magenta (hue 300)
      expect(hsbToRgb(300, 100, 100)).toEqual({ r: 255, g: 0, b: 255 });
    });

    it('converts white correctly', () => {
      expect(hsbToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('converts black correctly', () => {
      expect(hsbToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('converts grey (zero saturation) correctly', () => {
      const result = hsbToRgb(0, 0, 50);
      expect(result.r).toBe(result.g);
      expect(result.g).toBe(result.b);
      expect(result.r).toBeCloseTo(128, 0);
    });

    it('handles hue at boundary 360 same as 0', () => {
      // hue 360 should behave like hue 0 (red)
      const at360 = hsbToRgb(360, 100, 100);
      const at0 = hsbToRgb(0, 100, 100);
      expect(at360).toEqual(at0);
    });
  });

  describe('RGB <-> HSB round-trip', () => {
    it('round-trips primary colors', () => {
      const colors = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
      ];
      for (const color of colors) {
        const hsb = rgbToHsb(color.r, color.g, color.b);
        const back = hsbToRgb(hsb.hue, hsb.saturation, hsb.brightness);
        expect(back).toEqual(color);
      }
    });

    it('round-trips white and black', () => {
      const white = { r: 255, g: 255, b: 255 };
      const hsbW = rgbToHsb(white.r, white.g, white.b);
      expect(hsbToRgb(hsbW.hue, hsbW.saturation, hsbW.brightness)).toEqual(white);

      const black = { r: 0, g: 0, b: 0 };
      const hsbB = rgbToHsb(black.r, black.g, black.b);
      expect(hsbToRgb(hsbB.hue, hsbB.saturation, hsbB.brightness)).toEqual(black);
    });

    it('round-trips grey values', () => {
      const grey = { r: 128, g: 128, b: 128 };
      const hsb = rgbToHsb(grey.r, grey.g, grey.b);
      const back = hsbToRgb(hsb.hue, hsb.saturation, hsb.brightness);
      expect(back).toEqual(grey);
    });

    it('round-trips secondary colors', () => {
      const colors = [
        { r: 255, g: 255, b: 0 },   // Yellow
        { r: 0, g: 255, b: 255 },   // Cyan
        { r: 255, g: 0, b: 255 },   // Magenta
      ];
      for (const color of colors) {
        const hsb = rgbToHsb(color.r, color.g, color.b);
        const back = hsbToRgb(hsb.hue, hsb.saturation, hsb.brightness);
        expect(back).toEqual(color);
      }
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