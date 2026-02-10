import {
  DEVICE_ID_KEY,
  DEVICE_NAME_KEY,
  getOrCreateDeviceId,
  getDeviceName,
  setDeviceName,
  clearDeviceName,
  clearDeviceData,
  isDeviceRegistered,
  requestPersistentStorage,
  isPersistentStorageGranted,
} from '../device';

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn(() => 'test-uuid-12345678-1234-1234-1234-123456789012');
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
  },
});

describe('Device Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    mockRandomUUID.mockClear();
  });

  describe('getOrCreateDeviceId', () => {
    it('creates a new device ID when none exists', () => {
      const deviceId = getOrCreateDeviceId();
      expect(deviceId).toBe('test-uuid-12345678-1234-1234-1234-123456789012');
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBe(deviceId);
    });

    it('returns existing device ID from localStorage', () => {
      const existingId = 'existing-device-id';
      localStorage.setItem(DEVICE_ID_KEY, existingId);

      const deviceId = getOrCreateDeviceId();
      expect(deviceId).toBe(existingId);
      expect(mockRandomUUID).not.toHaveBeenCalled();
    });

    it('stores the created device ID in localStorage', () => {
      getOrCreateDeviceId();
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBe('test-uuid-12345678-1234-1234-1234-123456789012');
    });

    it('falls back to Math.random UUID when crypto is unavailable', () => {
      // Temporarily remove crypto
      const originalCrypto = global.crypto;
      Object.defineProperty(global, 'crypto', { value: undefined, writable: true, configurable: true });

      localStorage.clear();
      const deviceId = getOrCreateDeviceId();
      // Should be a valid UUID v4 format
      expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

      // Restore
      Object.defineProperty(global, 'crypto', { value: originalCrypto, writable: true, configurable: true });
    });
  });

  describe('getDeviceName', () => {
    it('returns null when no name is stored', () => {
      expect(getDeviceName()).toBeNull();
    });

    it('returns stored device name', () => {
      const name = 'Stage Manager iPad';
      localStorage.setItem(DEVICE_NAME_KEY, name);
      expect(getDeviceName()).toBe(name);
    });
  });

  describe('setDeviceName', () => {
    it('stores device name in localStorage', () => {
      const name = 'Booth Computer';
      setDeviceName(name);
      expect(localStorage.getItem(DEVICE_NAME_KEY)).toBe(name);
    });

    it('overwrites existing device name', () => {
      localStorage.setItem(DEVICE_NAME_KEY, 'Old Name');
      setDeviceName('New Name');
      expect(localStorage.getItem(DEVICE_NAME_KEY)).toBe('New Name');
    });
  });

  describe('clearDeviceName', () => {
    it('removes device name from localStorage', () => {
      localStorage.setItem(DEVICE_NAME_KEY, 'Test Device');
      clearDeviceName();
      expect(localStorage.getItem(DEVICE_NAME_KEY)).toBeNull();
    });

    it('does nothing when no name is stored', () => {
      clearDeviceName();
      expect(localStorage.getItem(DEVICE_NAME_KEY)).toBeNull();
    });
  });

  describe('clearDeviceData', () => {
    it('removes both device ID and name from localStorage', () => {
      localStorage.setItem(DEVICE_ID_KEY, 'test-id');
      localStorage.setItem(DEVICE_NAME_KEY, 'Test Device');

      clearDeviceData();

      expect(localStorage.getItem(DEVICE_ID_KEY)).toBeNull();
      expect(localStorage.getItem(DEVICE_NAME_KEY)).toBeNull();
    });
  });

  describe('isDeviceRegistered', () => {
    it('returns false when no name is stored', () => {
      expect(isDeviceRegistered()).toBe(false);
    });

    it('returns true when name is stored', () => {
      localStorage.setItem(DEVICE_NAME_KEY, 'Test Device');
      expect(isDeviceRegistered()).toBe(true);
    });
  });

  describe('requestPersistentStorage', () => {
    it('returns false when navigator.storage is not available', async () => {
      // navigator.storage is undefined in JSDOM by default
      const result = await requestPersistentStorage();
      expect(result).toBe(false);
    });

    it('requests persistent storage when available', async () => {
      const mockPersist = jest.fn().mockResolvedValue(true);
      Object.defineProperty(navigator, 'storage', {
        value: { persist: mockPersist },
        writable: true,
        configurable: true,
      });

      const result = await requestPersistentStorage();
      expect(mockPersist).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('handles storage.persist rejection gracefully', async () => {
      const mockPersist = jest.fn().mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(navigator, 'storage', {
        value: { persist: mockPersist },
        writable: true,
        configurable: true,
      });

      const result = await requestPersistentStorage();
      expect(result).toBe(false);
    });
  });

  describe('isPersistentStorageGranted', () => {
    it('returns false when navigator.storage is not available', async () => {
      // Reset to undefined
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await isPersistentStorageGranted();
      expect(result).toBe(false);
    });

    it('checks if persistent storage is granted', async () => {
      const mockPersisted = jest.fn().mockResolvedValue(true);
      Object.defineProperty(navigator, 'storage', {
        value: { persisted: mockPersisted },
        writable: true,
        configurable: true,
      });

      const result = await isPersistentStorageGranted();
      expect(mockPersisted).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('handles storage.persisted rejection gracefully', async () => {
      const mockPersisted = jest.fn().mockRejectedValue(new Error('Error'));
      Object.defineProperty(navigator, 'storage', {
        value: { persisted: mockPersisted },
        writable: true,
        configurable: true,
      });

      const result = await isPersistentStorageGranted();
      expect(result).toBe(false);
    });
  });
});
