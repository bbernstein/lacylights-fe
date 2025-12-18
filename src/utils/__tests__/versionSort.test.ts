import {
  parseVersion,
  compareVersions,
  sortVersionsDescending,
} from "../versionSort";

describe("versionSort", () => {
  describe("parseVersion", () => {
    it("parses version with v prefix", () => {
      const result = parseVersion("v1.2.3");
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
      });
    });

    it("parses version without v prefix", () => {
      const result = parseVersion("1.2.3");
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
      });
    });

    it("parses version with prerelease", () => {
      const result = parseVersion("v1.2.3-beta.1");
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "beta.1",
        prereleaseNumber: 1,
      });
    });

    it("parses version with prerelease without number", () => {
      const result = parseVersion("v1.2.3-alpha");
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "alpha",
      });
    });

    it("parses version with complex prerelease", () => {
      const result = parseVersion("v2.0.0-rc.5");
      expect(result).toEqual({
        major: 2,
        minor: 0,
        patch: 0,
        prerelease: "rc.5",
        prereleaseNumber: 5,
      });
    });

    it("returns null for invalid version", () => {
      expect(parseVersion("invalid")).toBeNull();
      expect(parseVersion("1.2")).toBeNull();
      expect(parseVersion("v1")).toBeNull();
      expect(parseVersion("")).toBeNull();
    });
  });

  describe("compareVersions", () => {
    it("compares major versions", () => {
      expect(compareVersions("v2.0.0", "v1.0.0")).toBeGreaterThan(0);
      expect(compareVersions("v1.0.0", "v2.0.0")).toBeLessThan(0);
    });

    it("compares minor versions when major is equal", () => {
      expect(compareVersions("v1.2.0", "v1.1.0")).toBeGreaterThan(0);
      expect(compareVersions("v1.1.0", "v1.2.0")).toBeLessThan(0);
    });

    it("compares patch versions when major and minor are equal", () => {
      expect(compareVersions("v1.1.3", "v1.1.2")).toBeGreaterThan(0);
      expect(compareVersions("v1.1.2", "v1.1.3")).toBeLessThan(0);
    });

    it("considers equal versions", () => {
      expect(compareVersions("v1.2.3", "v1.2.3")).toBe(0);
      expect(compareVersions("1.2.3", "v1.2.3")).toBe(0);
    });

    it("ranks release version higher than prerelease", () => {
      expect(compareVersions("v1.0.0", "v1.0.0-beta.1")).toBeGreaterThan(0);
      expect(compareVersions("v1.0.0-beta.1", "v1.0.0")).toBeLessThan(0);
    });

    it("compares prerelease versions lexicographically", () => {
      expect(compareVersions("v1.0.0-rc.1", "v1.0.0-beta.1")).toBeGreaterThan(
        0,
      );
      expect(compareVersions("v1.0.0-beta.1", "v1.0.0-rc.1")).toBeLessThan(0);
    });

    it("compares prerelease numbers when base is same", () => {
      expect(compareVersions("v1.0.0-beta.2", "v1.0.0-beta.1")).toBeGreaterThan(
        0,
      );
      expect(compareVersions("v1.0.0-beta.1", "v1.0.0-beta.2")).toBeLessThan(0);
    });

    it("handles invalid versions", () => {
      expect(compareVersions("invalid", "v1.0.0")).toBeGreaterThan(0);
      expect(compareVersions("v1.0.0", "invalid")).toBeLessThan(0);
      expect(compareVersions("invalid1", "invalid2")).toBe(0);
    });
  });

  describe("sortVersionsDescending", () => {
    it("sorts versions in descending order", () => {
      const versions = ["v1.0.0", "v1.2.0", "v1.1.0", "v2.0.0"];
      const sorted = sortVersionsDescending(versions);
      expect(sorted).toEqual(["v2.0.0", "v1.2.0", "v1.1.0", "v1.0.0"]);
    });

    it("sorts versions with prereleases correctly", () => {
      const versions = [
        "v1.1.6",
        "v1.1.7-beta.1",
        "v1.1.7",
        "v1.1.7-beta.2",
        "v1.0.10",
        "v1.1.6-beta.1",
        "v1.0.10-beta1",
      ];
      const sorted = sortVersionsDescending(versions);
      expect(sorted).toEqual([
        "v1.1.7",
        "v1.1.7-beta.2",
        "v1.1.7-beta.1",
        "v1.1.6",
        "v1.1.6-beta.1",
        "v1.0.10",
        "v1.0.10-beta1",
      ]);
    });

    it("handles the user example correctly", () => {
      const versions = [
        "v1.0.10-beta1",
        "v1.1.7",
        "v1.1.6-beta.1",
        "v1.0.10",
        "v1.1.7-beta.2",
        "v1.1.7-beta.1",
        "v1.1.6",
      ];
      const sorted = sortVersionsDescending(versions);
      expect(sorted).toEqual([
        "v1.1.7",
        "v1.1.7-beta.2",
        "v1.1.7-beta.1",
        "v1.1.6",
        "v1.1.6-beta.1",
        "v1.0.10",
        "v1.0.10-beta1",
      ]);
    });

    it("does not modify original array", () => {
      const versions = ["v1.0.0", "v2.0.0", "v1.5.0"];
      const original = [...versions];
      sortVersionsDescending(versions);
      expect(versions).toEqual(original);
    });

    it("handles empty array", () => {
      const sorted = sortVersionsDescending([]);
      expect(sorted).toEqual([]);
    });

    it("handles single version", () => {
      const sorted = sortVersionsDescending(["v1.0.0"]);
      expect(sorted).toEqual(["v1.0.0"]);
    });

    it("handles versions without v prefix", () => {
      const versions = ["1.0.0", "2.0.0", "1.5.0"];
      const sorted = sortVersionsDescending(versions);
      expect(sorted).toEqual(["2.0.0", "1.5.0", "1.0.0"]);
    });

    it("handles mixed prefix versions", () => {
      const versions = ["v1.0.0", "2.0.0", "v1.5.0"];
      const sorted = sortVersionsDescending(versions);
      expect(sorted).toEqual(["2.0.0", "v1.5.0", "v1.0.0"]);
    });
  });
});
