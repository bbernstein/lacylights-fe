import {
  dmxToPercent,
  percentToDmx,
  formatPercent,
  formatDmx,
  isPercentageChannel,
  percentStep,
  dmxStep,
} from '../dmxPercentage';
import { ChannelType } from '@/types';

describe('dmxPercentage', () => {
  describe('dmxToPercent', () => {
    it('converts 0 to 0', () => {
      expect(dmxToPercent(0)).toBe(0);
    });

    it('converts 255 to 100', () => {
      expect(dmxToPercent(255)).toBe(100);
    });

    it('converts 128 to approximately 50.2', () => {
      expect(dmxToPercent(128)).toBeCloseTo(50.2, 1);
    });

    it('converts 1 to approximately 0.4', () => {
      expect(dmxToPercent(1)).toBeCloseTo(0.4, 1);
    });

    it('handles custom min/max range', () => {
      // min=10, max=200: value 10 = 0%, value 200 = 100%
      expect(dmxToPercent(10, 10, 200)).toBe(0);
      expect(dmxToPercent(200, 10, 200)).toBe(100);
      expect(dmxToPercent(105, 10, 200)).toBe(50);
    });
  });

  describe('percentToDmx', () => {
    it('converts 0% to 0', () => {
      expect(percentToDmx(0)).toBe(0);
    });

    it('converts 100% to 255', () => {
      expect(percentToDmx(100)).toBe(255);
    });

    it('converts 50% to 128', () => {
      expect(percentToDmx(50)).toBe(128);
    });

    it('clamps above 100% to max', () => {
      expect(percentToDmx(110)).toBe(255);
    });

    it('clamps below 0% to min', () => {
      expect(percentToDmx(-5)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      // 50.2% of 255 = 128.01 -> 128
      expect(percentToDmx(50.2)).toBe(128);
    });

    it('handles custom min/max range', () => {
      expect(percentToDmx(0, 10, 200)).toBe(10);
      expect(percentToDmx(100, 10, 200)).toBe(200);
      expect(percentToDmx(50, 10, 200)).toBe(105);
    });
  });

  describe('formatPercent', () => {
    it('formats 0 as "0.0%"', () => {
      expect(formatPercent(0)).toBe('0.0%');
    });

    it('formats 255 as "100.0%"', () => {
      expect(formatPercent(255)).toBe('100.0%');
    });

    it('formats 128 with one decimal', () => {
      expect(formatPercent(128)).toBe('50.2%');
    });
  });

  describe('formatDmx', () => {
    it('formats as integer string', () => {
      expect(formatDmx(128)).toBe('128');
    });
  });

  describe('isPercentageChannel', () => {
    it('returns true for intensity channels', () => {
      expect(isPercentageChannel(ChannelType.INTENSITY)).toBe(true);
    });

    it('returns true for color channels', () => {
      expect(isPercentageChannel(ChannelType.RED)).toBe(true);
      expect(isPercentageChannel(ChannelType.GREEN)).toBe(true);
      expect(isPercentageChannel(ChannelType.BLUE)).toBe(true);
      expect(isPercentageChannel(ChannelType.WHITE)).toBe(true);
      expect(isPercentageChannel(ChannelType.AMBER)).toBe(true);
    });

    it('returns true for position channels', () => {
      expect(isPercentageChannel(ChannelType.PAN)).toBe(true);
      expect(isPercentageChannel(ChannelType.TILT)).toBe(true);
    });

    it('returns true for optical channels', () => {
      expect(isPercentageChannel(ChannelType.ZOOM)).toBe(true);
      expect(isPercentageChannel(ChannelType.FOCUS)).toBe(true);
      expect(isPercentageChannel(ChannelType.IRIS)).toBe(true);
    });

    it('returns true for strobe', () => {
      expect(isPercentageChannel(ChannelType.STROBE)).toBe(true);
    });

    it('returns false for discrete channels', () => {
      expect(isPercentageChannel(ChannelType.GOBO)).toBe(false);
      expect(isPercentageChannel(ChannelType.COLOR_WHEEL)).toBe(false);
      expect(isPercentageChannel(ChannelType.EFFECT)).toBe(false);
      expect(isPercentageChannel(ChannelType.MACRO)).toBe(false);
      expect(isPercentageChannel(ChannelType.OTHER)).toBe(false);
    });
  });

  describe('formatPercent with custom range', () => {
    it('formats with custom min/max', () => {
      // min=10, max=200: value 105 = 50.0%
      expect(formatPercent(105, 10, 200)).toBe('50.0%');
    });
  });

  describe('percentStep', () => {
    it('returns 1.0 for normal step', () => {
      expect(percentStep(false)).toBe(1.0);
    });

    it('returns 0.1 for fine/shift step', () => {
      expect(percentStep(true)).toBe(0.1);
    });
  });

  describe('dmxStep', () => {
    it('returns 1 for normal step', () => {
      expect(dmxStep(false)).toBe(1);
    });

    it('returns 10 for shift step (coarser in DMX mode)', () => {
      expect(dmxStep(true)).toBe(10);
    });
  });
});
