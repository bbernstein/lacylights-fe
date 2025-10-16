/**
 * Browser-compatible UUID generator as fallback for crypto.randomUUID()
 * This ensures compatibility with older browsers and environments
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID() first
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: Generate a RFC4122 version 4 UUID using Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
