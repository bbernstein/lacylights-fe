import { toHex } from '../ChannelListEditor';

describe('ChannelListEditor utilities', () => {
  describe('toHex', () => {
    it('converts 0 to "00"', () => {
      expect(toHex(0)).toBe('00');
    });

    it('converts 1 (max) to "FF"', () => {
      expect(toHex(1)).toBe('FF');
    });

    it('converts 0.5 to "80" (approximately 128)', () => {
      expect(toHex(0.5)).toBe('80');
    });

    it('converts normalized red (255/255 = 1) correctly', () => {
      expect(toHex(255 / 255)).toBe('FF');
    });

    it('converts normalized value (130/255) to "82"', () => {
      // 130/255 ≈ 0.5098, when multiplied by 255 and rounded = 130 = 0x82
      expect(toHex(130 / 255)).toBe('82');
    });

    it('pads single digit hex values with leading zero', () => {
      // 10/255 ≈ 0.0392, when multiplied by 255 and rounded = 10 = 0x0A
      expect(toHex(10 / 255)).toBe('0A');
    });

    it('returns uppercase hex characters', () => {
      expect(toHex(0.5)).toMatch(/^[0-9A-F]+$/);
    });

    it('handles edge case near boundaries', () => {
      // Just below 0.5/255 threshold
      expect(toHex(0.001)).toBe('00');
      // Just above 254.5/255 threshold
      expect(toHex(0.999)).toBe('FF');
    });
  });
});
