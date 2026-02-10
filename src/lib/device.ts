/**
 * Device identification and management utilities for browser-based device authentication.
 *
 * This module provides utilities for generating and storing device identifiers
 * in the browser. Unlike native applications that can use OS-level machine IDs,
 * browsers must rely on localStorage for device identification.
 *
 * The device ID is a UUID that persists across browser sessions. Combined with
 * a user-provided device name, this allows the backend to identify and authorize
 * specific devices (e.g., "Stage Manager iPad", "Tech Director Laptop").
 */

// Storage keys for device information
export const DEVICE_ID_KEY = 'lacylights_device_id';
export const DEVICE_NAME_KEY = 'lacylights_device_name';

/**
 * Generate a UUID, with fallback for non-secure contexts (HTTP).
 * generateUUID() is only available in secure contexts (HTTPS/localhost).
 * On plain HTTP (e.g., http://lacylights.local), we fall back to a manual
 * implementation using crypto.getRandomValues().
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: construct a v4 UUID from random bytes
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    // Last-resort fallback using Math.random (not cryptographically secure)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Set version (4) and variant (10xx) bits per RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Gets the existing device ID from localStorage or creates a new one.
 *
 * The device ID is a UUID that uniquely identifies this browser/device.
 * It persists across sessions but can be lost if the user clears browser data.
 *
 * @returns The device UUID (fingerprint)
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return empty string
    return '';
  }

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    // localStorage may not be available (private browsing, etc.)
    // Return a temporary ID that won't persist
    return generateUUID();
  }
}

/**
 * Gets the stored device name.
 *
 * The device name is a human-readable identifier set by the user during
 * device registration (e.g., "Stage Manager iPad", "Booth Computer").
 *
 * @returns The device name or null if not set
 */
export function getDeviceName(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(DEVICE_NAME_KEY);
  } catch {
    return null;
  }
}

/**
 * Sets the device name in localStorage.
 *
 * @param name - The human-readable device name
 */
export function setDeviceName(name: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(DEVICE_NAME_KEY, name);
  } catch {
    // localStorage may not be available
    console.warn('Failed to store device name - localStorage not available');
  }
}

/**
 * Clears the device name from localStorage.
 *
 * This is useful when the user wants to re-register the device with a new name.
 */
export function clearDeviceName(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(DEVICE_NAME_KEY);
  } catch {
    // localStorage may not be available
  }
}

/**
 * Clears all device identification data from localStorage.
 *
 * WARNING: This will require the device to be re-registered and re-approved
 * by an administrator. Use with caution.
 */
export function clearDeviceData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(DEVICE_NAME_KEY);
  } catch {
    // localStorage may not be available
  }
}

/**
 * Checks if the device has been registered (has a stored name).
 *
 * @returns True if the device has a name stored
 */
export function isDeviceRegistered(): boolean {
  return getDeviceName() !== null;
}

/**
 * Requests persistent storage for the PWA.
 *
 * Installing LacyLights as a PWA ("Add to Home Screen") and requesting
 * persistent storage provides:
 * - More durable localStorage (less likely to be evicted by the browser)
 * - Full-screen app experience
 * - Offline capability for basic viewing
 *
 * @returns True if persistent storage was granted, false otherwise
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (navigator.storage && navigator.storage.persist) {
    try {
      const granted = await navigator.storage.persist();
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`[Device] Persistent storage: ${granted ? 'granted' : 'denied'}`);
      }
      return granted;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Checks if persistent storage is already granted.
 *
 * @returns True if persistent storage is granted
 */
export async function isPersistentStorageGranted(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}
