/**
 * Constants for fixture-related operations
 */

/** Fallback value for unknown manufacturer */
export const UNKNOWN_MANUFACTURER = 'unknown';

/** Fallback value for unknown model */
export const UNKNOWN_MODEL = 'unknown';

/**
 * Generate a fixture key for mapping purposes
 * @param manufacturer - Fixture manufacturer (nullable)
 * @param model - Fixture model (nullable)
 * @returns A key string in format "manufacturer/model" with fallbacks applied
 */
export function getFixtureKey(
  manufacturer: string | null | undefined,
  model: string | null | undefined
): string {
  return `${manufacturer ?? UNKNOWN_MANUFACTURER}/${model ?? UNKNOWN_MODEL}`;
}

/**
 * Get manufacturer with fallback
 * @param manufacturer - Fixture manufacturer (nullable)
 * @returns Manufacturer or fallback value
 */
export function getManufacturer(manufacturer: string | null | undefined): string {
  return manufacturer ?? UNKNOWN_MANUFACTURER;
}

/**
 * Get model with fallback
 * @param model - Fixture model (nullable)
 * @returns Model or fallback value
 */
export function getModel(model: string | null | undefined): string {
  return model ?? UNKNOWN_MODEL;
}