import { generateUUID } from '../uuid';

describe('generateUUID', () => {
  describe('with native crypto.randomUUID support', () => {
    it('should generate a valid UUID when crypto.randomUUID is available', () => {
      // In JSDOM environment, crypto.randomUUID should be available
      const uuid = generateUUID();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
      expect(uuid).toHaveLength(36);
    });

    it('should generate unique UUIDs with native crypto', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid1).toHaveLength(36);
      expect(uuid2).toHaveLength(36);
    });
  });

  describe('fallback implementation', () => {
    beforeEach(() => {
      // Remove crypto.randomUUID to test fallback
      const originalCrypto = global.crypto;
      global.crypto = {
        ...originalCrypto,
        randomUUID: undefined as any,
      };
    });

    it('should generate a valid UUID v4 format', () => {
      const uuid = generateUUID();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });

    it('should always have 4 in the third group (version 4)', () => {
      const uuid = generateUUID();
      const thirdGroup = uuid.split('-')[2];

      expect(thirdGroup[0]).toBe('4');
    });

    it('should have variant bits (8, 9, a, or b) in the fourth group', () => {
      const uuid = generateUUID();
      const fourthGroup = uuid.split('-')[3];

      const firstChar = fourthGroup[0].toLowerCase();
      expect(['8', '9', 'a', 'b']).toContain(firstChar);
    });

    it('should generate 36-character string including hyphens', () => {
      const uuid = generateUUID();

      expect(uuid).toHaveLength(36);
      expect(uuid.split('-')).toHaveLength(5);
    });

    it('should only contain valid hex characters and hyphens', () => {
      const uuid = generateUUID();
      const validChars = /^[0-9a-f-]+$/i;

      expect(uuid).toMatch(validChars);
    });
  });

  describe('when crypto is undefined', () => {
    it('should use fallback when crypto is not defined', () => {
      const originalCrypto = global.crypto;
      (global as any).crypto = undefined;

      const uuid = generateUUID();

      // Should still generate valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);

      // Restore
      global.crypto = originalCrypto;
    });
  });
});
