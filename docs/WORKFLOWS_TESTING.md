# GitHub Actions Workflow Testing Guide

This document outlines test scenarios for the lacylights-fe GitHub Actions workflows after implementing automatic beta versioning.

## Overview

The lacylights-fe repository has two key workflows:
- **CI Workflow** (`.github/workflows/ci.yml`): Main continuous integration pipeline
- **Contract Tests** (`.github/workflows/contract-tests.yml`): Backend integration tests

## Modified Workflows

### CI Workflow Changes
The CI workflow was modified to support automatic beta version generation:
- Enabled `write` permissions for workflow, id-token, and contents
- Added conditional beta versioning step for `develop` branch
- Generates beta versions in format: `X.Y.Z-beta.N+sha.SHORT_SHA`
- Configures dual artifact uploads (static export + server build)

## Test Scenarios

### 1. Feature Branch Testing

**Scenario:** Push to a feature branch (e.g., `feat/prerelease-support`)

**Expected Behavior:**
- ✓ Workflow runs with standard permissions
- ✓ Code checkout succeeds
- ✓ Node.js environment setup (version 20)
- ✓ Dependencies installed via `npm ci`
- ✓ ESLint runs and passes
- ✓ Tests execute with passing results
- ✓ Build completes successfully (dual artifacts)
- ✓ NO version bump occurs
- ✓ NO artifact upload occurs

**Manual Testing:**
```bash
git checkout feat/prerelease-support
git push origin feat/prerelease-support
# Monitor workflow at: https://github.com/bbernstein/lacylights-fe/actions
```

### 2. Develop Branch Testing (Beta Versions)

**Scenario:** Merge or push to `develop` branch

**Expected Behavior:**
- ✓ All standard CI steps execute
- ✓ Beta versioning step activates
- ✓ Version bumped in format: `X.Y.Z-beta.N+sha.SHORT_SHA`
- ✓ package.json and package-lock.json updated
- ✓ Git commit created with version bump
- ✓ Tag created: `vX.Y.Z-beta.N+sha.SHORT_SHA`
- ✓ Changes pushed back to develop
- ✓ Dual artifacts uploaded:
  - `lacylights-fe-static-vX.Y.Z-beta.N+sha.SHORT_SHA.tar.gz`
  - `lacylights-fe-server-vX.Y.Z-beta.N+sha.SHORT_SHA.tar.gz`

**Manual Testing:**
```bash
git checkout develop
git merge feat/prerelease-support
git push origin develop
# Monitor workflow and verify:
# 1. Version in package.json updated
# 2. Git tag created
# 3. Two artifacts available for download
```

### 3. Main Branch Testing (Stable Releases)

**Scenario:** Merge to `main` branch (production release)

**Expected Behavior:**
- ✓ All standard CI steps execute
- ✓ NO automatic versioning (manual semantic versioning preferred)
- ✓ Build artifacts generated for release
- ✓ Ready for manual release tagging if needed

**Manual Testing:**
```bash
# After thorough testing on develop
git checkout main
git merge develop
git push origin main
# Verify workflow completes without version changes
```

### 4. Pull Request Testing

**Scenario:** Create PR from feature branch to develop or main

**Expected Behavior:**
- ✓ CI runs on PR commits
- ✓ Status checks must pass before merge
- ✓ No version bumps occur during PR validation
- ✓ Build succeeds for both artifact types

**Manual Testing:**
```bash
# Create PR via GitHub UI or:
gh pr create --base develop --head feat/prerelease-support \
  --title "Add automatic beta versioning" \
  --body "Implements beta version generation for develop branch"
# Verify CI runs and passes
```

### 5. Concurrent Push Testing

**Scenario:** Multiple pushes to develop in quick succession

**Expected Behavior:**
- ✓ Each workflow run generates unique beta version
- ✓ Beta number increments sequentially
- ✓ No race conditions or version conflicts
- ✓ Each commit gets unique SHORT_SHA identifier

**Manual Testing:**
```bash
# Make multiple small commits
git commit --allow-empty -m "Test commit 1"
git push origin develop
git commit --allow-empty -m "Test commit 2"
git push origin develop
# Verify both workflows complete with different beta numbers
```

### 6. Failed Build Testing

**Scenario:** Push code with linting errors or test failures

**Expected Behavior:**
- ✓ Workflow fails at appropriate step (lint/test/build)
- ✓ NO version bump occurs
- ✓ NO artifacts uploaded
- ✓ NO git tags created
- ✓ Clear error message in workflow logs

**Manual Testing:**
```bash
# Intentionally introduce error
echo "const x = 'missing semicolon'" >> src/test-error.ts
git add src/test-error.ts
git commit -m "Test: intentional error"
git push origin develop
# Verify workflow fails without creating version/tag
git reset --hard HEAD~1
git push origin develop --force
```

### 7. Artifact Download Testing

**Scenario:** Download and verify build artifacts

**Expected Behavior:**
- ✓ Static artifact contains static export
- ✓ Server artifact contains Next.js server build
- ✓ Both artifacts are properly compressed
- ✓ Artifacts are tagged with correct version

**Manual Testing:**
```bash
# After successful develop branch build:
# 1. Go to GitHub Actions run
# 2. Download both artifacts
# 3. Extract and verify contents:
tar -tzf lacylights-fe-static-vX.Y.Z-beta.N+sha.SHORT_SHA.tar.gz | head -20
tar -tzf lacylights-fe-server-vX.Y.Z-beta.N+sha.SHORT_SHA.tar.gz | head -20
```

## Contract Tests Workflow

The contract tests workflow remains unchanged and should continue to work normally.

**Test Scenario:** Push to any branch

**Expected Behavior:**
- ✓ Sets up PostgreSQL test database
- ✓ Clones and configures lacylights-go backend
- ✓ Runs GraphQL contract tests
- ✓ Validates frontend/backend integration

## Pre-Deployment Checklist

Before merging beta versioning changes to develop:

- [ ] All tests pass on feature branch
- [ ] Build succeeds for both artifact types
- [ ] ESLint shows no errors
- [ ] Code coverage meets minimum thresholds
- [ ] Workflow YAML is valid (GitHub validates on push)
- [ ] Permissions are correctly scoped
- [ ] Version bump script is tested locally
- [ ] Git user configuration is correct in workflow

## Known Limitations

1. **Coverage Below Threshold**: Current coverage is ~52%, below the 75% target
   - This is a pre-existing issue, not related to workflow changes
   - Should be addressed in separate PRs

2. **Prettier Formatting**: 151 files have formatting issues
   - Pre-existing condition
   - Consider running `prettier --write .` in separate PR

3. **Dual Artifacts**: This repo generates two artifacts (static + server)
   - Workflow correctly handles both
   - Ensure deployment scripts account for dual artifacts

## Monitoring

After deploying changes to develop:

1. Monitor GitHub Actions: https://github.com/bbernstein/lacylights-fe/actions
2. Check for successful beta version tags
3. Verify artifact uploads in Actions artifacts
4. Review git commit history for version bumps
5. Monitor for any permission errors or failures

## Rollback Plan

If beta versioning causes issues:

1. Revert the workflow changes:
   ```bash
   git revert <commit-hash>
   git push origin develop
   ```

2. Delete problematic beta tags:
   ```bash
   git tag -d vX.Y.Z-beta.N+sha.SHORT_SHA
   git push origin :refs/tags/vX.Y.Z-beta.N+sha.SHORT_SHA
   ```

3. Manual cleanup if needed:
   ```bash
   git reset --hard HEAD~1
   git push origin develop --force
   ```

## Additional Notes

- The workflow uses `dawidd6/action-download-artifact@v6` for artifact handling
- Version bumping uses standard npm version commands
- Git operations use GitHub Actions token for authentication
- All version changes are committed back to the branch automatically

## Success Criteria

A successful workflow run should show:
- ✓ Green checkmark on all workflow steps
- ✓ New beta version tag visible in repository
- ✓ Two downloadable artifacts with correct naming
- ✓ Updated package.json in develop branch
- ✓ Clear commit message for version bump

## Support

For issues or questions:
- Review workflow logs in GitHub Actions
- Check `.github/workflows/ci.yml` for configuration
- Consult `RASPBERRY_PI_PRODUCT_PLAN.md` for context
- Review git history: `git log --oneline --graph develop`
