/**
 * Utility functions for version handling in the system update page.
 */

/** Check if a version string indicates a prerelease */
export function isPrerelease(version: string): boolean {
  const normalized = version.startsWith('v') ? version.slice(1) : version;
  return /[-+]/.test(normalized) || /alpha|beta|rc|pre/i.test(normalized);
}

/** Parse version for sorting (handles v prefix and prerelease) */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
} {
  const normalized = version.startsWith('v') ? version.slice(1) : version;
  const [versionPart, prereleasePart = ''] = normalized.split(/[-+]/);
  const [major = 0, minor = 0, patch = 0] = versionPart.split('.').map(Number);
  return { major, minor, patch, prerelease: prereleasePart };
}

/** Compare two versions for sorting (newest first) */
export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vB.major - vA.major;
  if (vA.minor !== vB.minor) return vB.minor - vA.minor;
  if (vA.patch !== vB.patch) return vB.patch - vA.patch;

  // Stable versions come before prereleases
  if (!vA.prerelease && vB.prerelease) return -1;
  if (vA.prerelease && !vB.prerelease) return 1;

  // Sort prereleases alphabetically
  return vA.prerelease.localeCompare(vB.prerelease);
}
