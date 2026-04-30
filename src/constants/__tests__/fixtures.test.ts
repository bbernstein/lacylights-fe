import {
  UNKNOWN_MANUFACTURER,
  UNKNOWN_MODEL,
  DEFAULT_MODE_NAME,
  getFixtureKey,
  getManufacturer,
  getModel,
  shouldDisplayModeName,
} from '../fixtures';

describe('fixtures constants', () => {
  describe('UNKNOWN_MANUFACTURER', () => {
    it('should have the correct fallback value', () => {
      expect(UNKNOWN_MANUFACTURER).toBe('unknown');
    });
  });

  describe('UNKNOWN_MODEL', () => {
    it('should have the correct fallback value', () => {
      expect(UNKNOWN_MODEL).toBe('unknown');
    });
  });

  describe('DEFAULT_MODE_NAME', () => {
    it('should match the backend sentinel for the implicit default mode', () => {
      expect(DEFAULT_MODE_NAME).toBe('default');
    });
  });

  describe('getFixtureKey', () => {
    it('should return correct key with both manufacturer and model', () => {
      expect(getFixtureKey('Chauvet', 'Intimidator Spot 255 IRC')).toBe(
        'Chauvet/Intimidator Spot 255 IRC'
      );
    });

    it('should use fallback for null manufacturer', () => {
      expect(getFixtureKey(null, 'Model123')).toBe('unknown/Model123');
    });

    it('should use fallback for undefined manufacturer', () => {
      expect(getFixtureKey(undefined, 'Model123')).toBe('unknown/Model123');
    });

    it('should use fallback for null model', () => {
      expect(getFixtureKey('Manufacturer123', null)).toBe('Manufacturer123/unknown');
    });

    it('should use fallback for undefined model', () => {
      expect(getFixtureKey('Manufacturer123', undefined)).toBe('Manufacturer123/unknown');
    });

    it('should use fallback for both null values', () => {
      expect(getFixtureKey(null, null)).toBe('unknown/unknown');
    });

    it('should use fallback for both undefined values', () => {
      expect(getFixtureKey(undefined, undefined)).toBe('unknown/unknown');
    });
  });

  describe('getManufacturer', () => {
    it('should return manufacturer when provided', () => {
      expect(getManufacturer('Chauvet')).toBe('Chauvet');
    });

    it('should return fallback for null', () => {
      expect(getManufacturer(null)).toBe(UNKNOWN_MANUFACTURER);
    });

    it('should return fallback for undefined', () => {
      expect(getManufacturer(undefined)).toBe(UNKNOWN_MANUFACTURER);
    });
  });

  describe('getModel', () => {
    it('should return model when provided', () => {
      expect(getModel('Intimidator Spot 255 IRC')).toBe('Intimidator Spot 255 IRC');
    });

    it('should return fallback for null', () => {
      expect(getModel(null)).toBe(UNKNOWN_MODEL);
    });

    it('should return fallback for undefined', () => {
      expect(getModel(undefined)).toBe(UNKNOWN_MODEL);
    });
  });

  describe('shouldDisplayModeName', () => {
    it('should display a real mode name', () => {
      expect(shouldDisplayModeName('16-channel')).toBe(true);
      expect(shouldDisplayModeName('Mode A')).toBe(true);
    });

    it('should hide the implicit default sentinel', () => {
      expect(shouldDisplayModeName('default')).toBe(false);
      expect(shouldDisplayModeName(DEFAULT_MODE_NAME)).toBe(false);
    });

    it('should hide null, undefined, and empty mode names', () => {
      expect(shouldDisplayModeName(null)).toBe(false);
      expect(shouldDisplayModeName(undefined)).toBe(false);
      expect(shouldDisplayModeName('')).toBe(false);
    });

    it('should be case-sensitive (only the exact sentinel is suppressed)', () => {
      // The backend sentinel is the lowercase string "default"; a mode that
      // happens to be named "Default" with different casing should still be
      // shown to the user — it is a real mode, not the implicit one.
      expect(shouldDisplayModeName('Default')).toBe(true);
      expect(shouldDisplayModeName('DEFAULT')).toBe(true);
    });
  });
});
