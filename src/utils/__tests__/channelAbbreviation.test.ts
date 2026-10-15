import { abbreviateChannelName } from '../channelAbbreviation';
import { ChannelType } from '@/types';

describe('abbreviateChannelName', () => {
  describe('existing channel types', () => {
    it('abbreviates basic color channels', () => {
      expect(abbreviateChannelName({ name: 'Red', type: ChannelType.RED })).toBe('R');
      expect(abbreviateChannelName({ name: 'Warm White', type: ChannelType.WARM_WHITE })).toBe('WW');
      expect(abbreviateChannelName({ name: 'Cold White', type: ChannelType.COLD_WHITE })).toBe('ClW');
    });

    it('appends numbers and fine qualifiers', () => {
      expect(abbreviateChannelName({ name: 'Red 1', type: ChannelType.RED })).toBe('R1');
      expect(abbreviateChannelName({ name: 'Fine Red', type: ChannelType.RED })).toBe('Rf');
    });

    it('uses smart abbreviation for OTHER channels', () => {
      expect(abbreviateChannelName({ name: 'Pan/Tilt Speed', type: ChannelType.OTHER })).toBe('PT');
      expect(abbreviateChannelName({ name: 'Color Temp', type: ChannelType.OTHER })).toBe('CT');
    });
  });

  describe('COLOR_TEMPERATURE, HUE, SATURATION and SPEED', () => {
    it.each([
      [ChannelType.COLOR_TEMPERATURE, 'Color Temperature', 'CT'],
      [ChannelType.HUE, 'Hue', 'Hu'],
      [ChannelType.SATURATION, 'Saturation', 'Sa'],
      [ChannelType.SPEED, 'Speed', 'Sp'],
    ])('abbreviates %s channel "%s" as %s', (type, name, expected) => {
      expect(abbreviateChannelName({ name, type })).toBe(expected);
    });

    it('keeps the CT abbreviation consistent with OTHER-typed "Color Temp" channels', () => {
      expect(abbreviateChannelName({ name: 'CTO', type: ChannelType.COLOR_TEMPERATURE })).toBe(
        abbreviateChannelName({ name: 'Color Temp', type: ChannelType.OTHER })
      );
    });

    it('applies fine and numeric qualifiers', () => {
      expect(abbreviateChannelName({ name: 'Hue Fine', type: ChannelType.HUE })).toBe('Huf');
      expect(abbreviateChannelName({ name: 'Saturation 16 bit', type: ChannelType.SATURATION })).toBe('Sa16');
      expect(abbreviateChannelName({ name: 'Speed 2', type: ChannelType.SPEED })).toBe('Sp2');
      expect(abbreviateChannelName({ name: 'CCT Fine', type: ChannelType.COLOR_TEMPERATURE })).toBe('CTf');
    });
  });
});
