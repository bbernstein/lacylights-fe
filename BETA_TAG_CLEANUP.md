# Beta Version Tag Cleanup (2025-11-24)

## Problem

The lacylights-fe repository had two incorrectly formatted beta version tags created by an old version of the release workflow:

- `v0.7.5-b2` (should have been `v0.7.5b2` - NO dash before 'b')
- `v0.7.4-` (malformed tag with trailing dash, created during beta finalization)

## Correct Beta Format

Beta versions MUST use the format: `X.Y.Zb[N]` with NO dashes

- Correct: `v0.7.5b2`, `v1.0.0b1`, `v2.3.1b5`
- Incorrect: `v0.7.5-b2`, `v1.0.0-b1` (has dashes)
- Incorrect: `v0.7.4-` (trailing dash)

## Actions Taken

1. Deleted bad local tags:
   ```bash
   git tag -d v0.7.4- v0.7.5-b2
   ```

2. Deleted bad remote tags:
   ```bash
   git push origin :refs/tags/v0.7.4- :refs/tags/v0.7.5-b2
   ```

## Current Status

- All bad tags have been removed from both local and remote repositories
- The release workflow in `.github/workflows/release.yml` is already correct and uses NO dashes
- Future beta releases will use the correct format: `X.Y.Zb[N]`

## Workflow Verification

The current workflow correctly uses:
- Regex pattern: `b[0-9]+$` (NO dash)
- Version creation: `${BASE_VERSION}b${NEW_BETA_NUM}` (NO dash)
- All string concatenations avoid dashes

This cleanup ensures consistency across all LacyLights repositories and prevents issues with version comparison logic.
