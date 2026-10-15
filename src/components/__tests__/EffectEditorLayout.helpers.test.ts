import { getChannelTypeColor, getChannelTypeAbbreviation } from '../EffectEditorLayout';
import { ChannelType } from '@/generated/graphql';

describe('EffectEditorLayout channel type helpers', () => {
  describe('getChannelTypeColor', () => {
    it('returns existing colors for color channels', () => {
      expect(getChannelTypeColor(ChannelType.Red)).toBe('#ef4444');
      expect(getChannelTypeColor(ChannelType.WarmWhite)).toBe('#f5f5f5');
      expect(getChannelTypeColor(ChannelType.Intensity)).toBe('#9ca3af');
    });

    it('returns a warm off-white for COLOR_TEMPERATURE', () => {
      expect(getChannelTypeColor(ChannelType.ColorTemperature)).toBe('#fde68a');
    });

    it('returns the neutral default grey for HUE, SATURATION and SPEED', () => {
      const defaultColor = getChannelTypeColor(ChannelType.Other);
      expect(defaultColor).toBe('#6b7280');
      expect(getChannelTypeColor(ChannelType.Hue)).toBe(defaultColor);
      expect(getChannelTypeColor(ChannelType.Saturation)).toBe(defaultColor);
      expect(getChannelTypeColor(ChannelType.Speed)).toBe(defaultColor);
    });
  });

  describe('getChannelTypeAbbreviation', () => {
    it('returns existing abbreviations', () => {
      expect(getChannelTypeAbbreviation(ChannelType.WarmWhite)).toBe('WW');
      expect(getChannelTypeAbbreviation(ChannelType.Effect)).toBe('Fx');
      expect(getChannelTypeAbbreviation(ChannelType.Other)).toBe('Other');
    });

    it.each([
      [ChannelType.ColorTemperature, 'CCT'],
      [ChannelType.Hue, 'Hue'],
      [ChannelType.Saturation, 'Sat'],
      [ChannelType.Speed, 'Spd'],
    ])('abbreviates %s as %s', (type, expected) => {
      expect(getChannelTypeAbbreviation(type)).toBe(expected);
    });

    it('has a non-empty abbreviation for every ChannelType value', () => {
      for (const type of Object.values(ChannelType)) {
        expect(getChannelTypeAbbreviation(type)).toBeTruthy();
      }
    });
  });
});
