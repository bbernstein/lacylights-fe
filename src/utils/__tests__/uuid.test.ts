import { generateUUID } from '../uuid';

describe('generateUUID', () => {
  it('generates a valid UUID v4 format', () => {
    const uuid = generateUUID();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it('generates unique UUIDs on each call', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    const uuid3 = generateUUID();

    expect(uuid1).not.toBe(uuid2);
    expect(uuid2).not.toBe(uuid3);
    expect(uuid1).not.toBe(uuid3);
  });

  it('generates UUIDs with correct length', () => {
    const uuid = generateUUID();
    expect(uuid.length).toBe(36); // 32 hex chars + 4 dashes
  });

  it('generates many unique UUIDs without collision', () => {
    const uuids = new Set<string>();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      uuids.add(generateUUID());
    }

    expect(uuids.size).toBe(count);
  });

  describe('fallback implementation', () => {
    it('uses fallback when crypto.randomUUID is not available', () => {
      // Store original crypto
      const originalCrypto = global.crypto;

      // Mock crypto without randomUUID
      Object.defineProperty(global, 'crypto', {
        value: {
          getRandomValues: originalCrypto?.getRandomValues,
        },
        writable: true,
        configurable: true,
      });

      const uuid = generateUUID();

      // Should still generate valid UUID v4 format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);

      // Restore original crypto
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });

    it('uses fallback when crypto is undefined', () => {
      // Store original crypto
      const originalCrypto = global.crypto;

      // Remove crypto entirely
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const uuid = generateUUID();

      // Should still generate valid UUID v4 format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);

      // Restore original crypto
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });
  });
});
