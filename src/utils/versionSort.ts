/**
 * Parse a semantic version string into its components.
 * Handles versions with or without 'v' prefix.
 * Examples: v1.2.3, v1.2.3-beta.1, 1.2.3-rc.1
 *
 * @param version - The version string to parse
 * @returns Parsed version components or null if invalid
 */
export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  prereleaseBase?: string;
  prereleaseNumber?: number;
}

export function parseVersion(version: string): ParsedVersion | null {
  // Prevent DoS from extremely long version strings
  if (!version || version.length > 100) {
    return null;
  }

  // Remove 'v' prefix if present
  const cleanVersion = version.startsWith("v") ? version.slice(1) : version;

  // Match semver pattern: major.minor.patch[-prerelease]
  // Pre-release can only contain alphanumerics, hyphens, and dots
  const match = cleanVersion.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z\-.]+))?$/,
  );
  if (!match) {
    return null;
  }

  const [, major, minor, patch, prerelease] = match;
  const parsed: ParsedVersion = {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
  };

  if (prerelease) {
    parsed.prerelease = prerelease;
    // Extract base and numeric suffix separately (e.g., "beta.2" -> base: "beta", number: 2)
    const prereleaseMatch = prerelease.match(/^([a-z]+)(?:\.(\d+))?$/i);
    if (prereleaseMatch) {
      parsed.prereleaseBase = prereleaseMatch[1];
      if (prereleaseMatch[2]) {
        parsed.prereleaseNumber = parseInt(prereleaseMatch[2], 10);
      }
    }
  }

  return parsed;
}

/**
 * Compare two version strings using semantic versioning rules.
 * Returns:
 *   - negative number if a < b
 *   - 0 if a === b
 *   - positive number if a > b
 *
 * Comparison rules:
 * 1. Major.minor.patch are compared numerically
 * 2. Release versions > pre-release versions (1.0.0 > 1.0.0-beta.1)
 * 3. Pre-release versions are compared lexicographically
 * 4. Pre-release numeric suffixes are compared numerically (beta.2 > beta.1)
 *
 * @param a - First version string
 * @param b - Second version string
 * @returns Comparison result
 */
export function compareVersions(a: string, b: string): number {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);

  // Invalid versions go to the end
  if (!parsedA && !parsedB) return 0;
  if (!parsedA) return 1;
  if (!parsedB) return -1;

  // Compare major.minor.patch
  if (parsedA.major !== parsedB.major) {
    return parsedA.major - parsedB.major;
  }
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor - parsedB.minor;
  }
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch - parsedB.patch;
  }

  // If versions are equal, check pre-release
  // Release version (no prerelease) > pre-release version
  if (!parsedA.prerelease && parsedB.prerelease) {
    return 1; // a is release, b is prerelease, so a > b
  }
  if (parsedA.prerelease && !parsedB.prerelease) {
    return -1; // a is prerelease, b is release, so a < b
  }

  // Both have pre-release, compare them
  if (parsedA.prerelease && parsedB.prerelease) {
    // Compare pre-release base first (alpha, beta, rc, etc.)
    const baseA = parsedA.prereleaseBase || parsedA.prerelease;
    const baseB = parsedB.prereleaseBase || parsedB.prerelease;
    const baseCompare = baseA.localeCompare(baseB);
    if (baseCompare !== 0) {
      return baseCompare;
    }

    // If bases are equal, compare numeric suffixes
    const numA = parsedA.prereleaseNumber ?? 0;
    const numB = parsedB.prereleaseNumber ?? 0;
    return numA - numB;
  }

  return 0; // Versions are equal
}

/**
 * Sort an array of version strings in descending order (newest first).
 * Follows semantic versioning rules.
 *
 * @param versions - Array of version strings to sort
 * @returns New sorted array (does not modify original)
 */
export function sortVersionsDescending(versions: string[]): string[] {
  return [...versions].sort((a, b) => compareVersions(b, a));
}
