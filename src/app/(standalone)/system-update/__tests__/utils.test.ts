import { isPrerelease, parseVersion, compareVersions } from '../utils';

describe('system-update utils', () => {
  describe('isPrerelease', () => {
    it('returns false for stable versions', () => {
      expect(isPrerelease('1.0.0')).toBe(false);
      expect(isPrerelease('v1.0.0')).toBe(false);
      expect(isPrerelease('2.3.4')).toBe(false);
    });

    it('returns true for versions with hyphen separators (prerelease)', () => {
      expect(isPrerelease('1.0.0-beta')).toBe(true);
      expect(isPrerelease('v1.0.0-alpha.1')).toBe(true);
      expect(isPrerelease('1.0.0-rc.1')).toBe(true);
    });

    it('returns false for versions with build metadata only (plus sign)', () => {
      // Per semver: build metadata (+) does NOT indicate prerelease
      expect(isPrerelease('1.0.0+build.123')).toBe(false);
      expect(isPrerelease('v1.0.0+20231201')).toBe(false);
    });

    it('returns true for prerelease with build metadata', () => {
      expect(isPrerelease('1.0.0-beta+build.123')).toBe(true);
      expect(isPrerelease('1.0.0-alpha.1+20231201')).toBe(true);
    });

    it('returns true for versions with alpha/beta/rc/pre keywords', () => {
      expect(isPrerelease('1.0.0alpha')).toBe(true);
      expect(isPrerelease('1.0.0Beta')).toBe(true);
      expect(isPrerelease('1.0.0RC1')).toBe(true);
      expect(isPrerelease('1.0.0pre')).toBe(true);
    });
  });

  describe('parseVersion', () => {
    it('parses simple version strings', () => {
      expect(parseVersion('1.2.3')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: '',
      });
    });

    it('handles v prefix', () => {
      expect(parseVersion('v1.2.3')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: '',
      });
    });

    it('extracts prerelease portion', () => {
      expect(parseVersion('1.2.3-beta.1')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'beta.1',
      });
    });

    it('ignores build metadata (plus sign)', () => {
      // Per semver: build metadata should be ignored for version comparison
      expect(parseVersion('1.2.3+build.123')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: '',
      });
    });

    it('extracts prerelease while ignoring build metadata', () => {
      expect(parseVersion('1.2.3-beta.1+build.123')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'beta.1',
      });
    });

    it('handles missing minor/patch versions', () => {
      expect(parseVersion('1')).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: '',
      });
      expect(parseVersion('1.2')).toEqual({
        major: 1,
        minor: 2,
        patch: 0,
        prerelease: '',
      });
    });
  });

  describe('compareVersions', () => {
    it('sorts by major version (descending)', () => {
      const versions = ['1.0.0', '3.0.0', '2.0.0'];
      expect(versions.sort(compareVersions)).toEqual(['3.0.0', '2.0.0', '1.0.0']);
    });

    it('sorts by minor version (descending)', () => {
      const versions = ['1.1.0', '1.3.0', '1.2.0'];
      expect(versions.sort(compareVersions)).toEqual(['1.3.0', '1.2.0', '1.1.0']);
    });

    it('sorts by patch version (descending)', () => {
      const versions = ['1.0.1', '1.0.3', '1.0.2'];
      expect(versions.sort(compareVersions)).toEqual(['1.0.3', '1.0.2', '1.0.1']);
    });

    it('puts stable versions before prereleases of same version', () => {
      const versions = ['1.0.0-beta', '1.0.0', '1.0.0-alpha'];
      expect(versions.sort(compareVersions)).toEqual(['1.0.0', '1.0.0-beta', '1.0.0-alpha']);
    });

    it('handles v prefix consistently', () => {
      const versions = ['v1.0.0', 'v2.0.0', 'v1.5.0'];
      expect(versions.sort(compareVersions)).toEqual(['v2.0.0', 'v1.5.0', 'v1.0.0']);
    });

    it('sorts mixed stable and prerelease versions correctly', () => {
      const versions = ['1.0.0', '1.1.0-beta', '1.0.1', '1.1.0'];
      expect(versions.sort(compareVersions)).toEqual([
        '1.1.0',
        '1.1.0-beta',
        '1.0.1',
        '1.0.0',
      ]);
    });

    it('returns 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('v1.0.0', 'v1.0.0')).toBe(0);
    });

    it('sorts prerelease versions with numeric identifiers correctly', () => {
      // Per semver: numeric identifiers are compared as integers
      // beta.10 > beta.2 (numerically, not alphabetically)
      const versions = ['1.0.0-beta.2', '1.0.0-beta.10', '1.0.0-beta.1'];
      expect(versions.sort(compareVersions)).toEqual([
        '1.0.0-beta.10',
        '1.0.0-beta.2',
        '1.0.0-beta.1',
      ]);
    });

    it('ignores build metadata for comparison', () => {
      // Per semver: build metadata should be ignored
      expect(compareVersions('1.0.0+build.123', '1.0.0+build.456')).toBe(0);
      expect(compareVersions('1.0.0+build', '1.0.0')).toBe(0);
    });
  });
});
