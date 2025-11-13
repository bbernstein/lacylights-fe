import {
  UNKNOWN_MANUFACTURER,
  UNKNOWN_MODEL,
  getFixtureKey,
  getManufacturer,
  getModel,
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
});
