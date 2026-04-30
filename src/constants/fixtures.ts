/**
 * Constants for fixture-related operations
 */

/** Fallback value for unknown manufacturer */
export const UNKNOWN_MANUFACTURER = 'unknown';

/** Fallback value for unknown model */
export const UNKNOWN_MODEL = 'unknown';

/**
 * Sentinel value used by the backend for the implicit default mode of a
 * fixture. This is treated as "no real mode" by the UI and is hidden from
 * mode-display affordances so users don't see a redundant "default" label.
 */
export const DEFAULT_MODE_NAME = 'default';

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

/**
 * Returns true when a fixture's `modeName` is meaningful enough to display
 * to the user. This is the UI guard used by the Fixtures list to decide
 * whether to render the mode row in the Manufacturer / Model cell and the
 * mobile card: empty / nullish values are hidden, and the backend's
 * implicit-default sentinel ({@link DEFAULT_MODE_NAME}) is also hidden so
 * simple fixtures don't show a redundant "default" label.
 *
 * Centralised here so both desktop and mobile layouts stay in sync if the
 * sentinel ever changes, and so the behaviour is easy to unit-test.
 */
export function shouldDisplayModeName(
  modeName: string | null | undefined
): modeName is string {
  return Boolean(modeName) && modeName !== DEFAULT_MODE_NAME;
}