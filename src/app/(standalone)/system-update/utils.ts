/**
 * Utility functions for version handling in the system update page.
 * Follows Semantic Versioning 2.0.0 specification (semver.org).
 */

/**
 * Check if a version string indicates a prerelease.
 * Per semver: prerelease versions have a hyphen (-) followed by identifiers.
 * Build metadata (+) does NOT indicate a prerelease.
 */
export function isPrerelease(version: string): boolean {
  const normalized = version.startsWith('v') ? version.slice(1) : version;
  // Strip build metadata first (after +), then check for prerelease (-)
  const withoutBuildMetadata = normalized.split('+')[0];
  return withoutBuildMetadata.includes('-') || /alpha|beta|rc|pre/i.test(withoutBuildMetadata);
}

/**
 * Parse version for sorting (handles v prefix, prerelease, and build metadata).
 * Per semver: build metadata (+) should be ignored for comparison.
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
} {
  const normalized = version.startsWith('v') ? version.slice(1) : version;
  // Strip build metadata first (everything after +)
  const withoutBuildMetadata = normalized.split('+')[0];
  // Split on first hyphen to separate version core from prerelease
  const hyphenIndex = withoutBuildMetadata.indexOf('-');
  let versionPart: string;
  let prereleasePart = '';

  if (hyphenIndex !== -1) {
    versionPart = withoutBuildMetadata.slice(0, hyphenIndex);
    prereleasePart = withoutBuildMetadata.slice(hyphenIndex + 1);
  } else {
    versionPart = withoutBuildMetadata;
  }

  const [major = 0, minor = 0, patch = 0] = versionPart.split('.').map(Number);
  return { major, minor, patch, prerelease: prereleasePart };
}

/**
 * Compare prerelease identifiers according to semver rules.
 * Numeric identifiers are compared as integers, others as strings.
 */
function comparePrereleaseIdentifiers(a: string, b: string): number {
  if (a === b) return 0;
  if (!a && b) return -1; // No prerelease (stable) comes first
  if (a && !b) return 1;

  const partsA = a.split('.');
  const partsB = b.split('.');
  const maxLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLength; i++) {
    const partA = partsA[i];
    const partB = partsB[i];

    // Missing parts come first (fewer identifiers = lower precedence)
    if (partA === undefined && partB !== undefined) return -1;
    if (partA !== undefined && partB === undefined) return 1;

    const numA = /^\d+$/.test(partA) ? parseInt(partA, 10) : null;
    const numB = /^\d+$/.test(partB) ? parseInt(partB, 10) : null;

    // Numeric identifiers have lower precedence than non-numeric
    if (numA !== null && numB === null) return -1;
    if (numA === null && numB !== null) return 1;

    // Both numeric: compare as integers
    if (numA !== null && numB !== null) {
      if (numA !== numB) return numA - numB;
      continue;
    }

    // Both non-numeric: compare as strings
    const cmp = partA.localeCompare(partB);
    if (cmp !== 0) return cmp;
  }

  return 0;
}

/** Compare two versions for sorting (newest first) */
export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vB.major - vA.major;
  if (vA.minor !== vB.minor) return vB.minor - vA.minor;
  if (vA.patch !== vB.patch) return vB.patch - vA.patch;

  // Stable versions come before prereleases (for newest-first sorting)
  if (!vA.prerelease && vB.prerelease) return -1;
  if (vA.prerelease && !vB.prerelease) return 1;

  // Compare prereleases (reverse for newest-first)
  // Use || 0 to avoid returning -0 (which is !== 0 in Object.is)
  return -comparePrereleaseIdentifiers(vA.prerelease, vB.prerelease) || 0;
}
