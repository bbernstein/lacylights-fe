# LacyLights Frontend Release Process

This document describes the release process for the LacyLights Frontend, including beta (prerelease) and stable releases.

## Overview

The LacyLights Frontend uses an automated GitHub Actions workflow to create releases. The workflow handles:
- Version bumping (major, minor, or patch)
- Beta version management
- Building TWO separate artifacts (static and server builds)
- Distribution via S3 and DynamoDB
- GitHub Release creation

## Dual Build Artifacts

The release process creates **TWO distinct artifacts** for different deployment scenarios:

### 1. fe-static (Raspberry Pi)
- **Artifact**: `lacylights-fe-static-vX.Y.Z.tar.gz`
- **Build Command**: `npm run build:static`
- **Contains**: Static Next.js export in `out/` directory
- **Deployment**: Nginx serves static files on Raspberry Pi
- **Use Case**: Standalone hardware product, no Node.js server required
- **Distribution URL**: `https://dist.lacylights.com/releases/fe-static/`

### 2. fe-server (Mac App)
- **Artifact**: `lacylights-fe-server-vX.Y.Z.tar.gz`
- **Build Command**: `npm run build`
- **Contains**: Full Next.js server build with `.next/`, `node_modules/`, API routes
- **Deployment**: Runs as Node.js server with `npm start`
- **Use Case**: Mac desktop application, supports API routes and server features
- **Distribution URL**: `https://dist.lacylights.com/releases/fe-server/`

## Version Format

LacyLights follows semantic versioning with beta support:

- **Stable Release**: `X.Y.Z` (e.g., `0.7.2`, `1.0.0`)
- **Beta Release**: `X.Y.ZbN` (e.g., `0.7.3b1`, `0.7.3b2`, `1.0.0b1`)
  - `X.Y.Z` = semantic version
  - `b` = beta identifier (literal character)
  - `N` = beta iteration number (starts at 1)

### Version Progression Examples

#### Creating First Beta
```
Current: 0.7.2 (stable)
Action: Create beta with patch bump
Result: 0.7.3b1
```

#### Incrementing Beta
```
Current: 0.7.3b1 (beta)
Action: Create another beta
Result: 0.7.3b2 (version_bump choice is ignored)
```

#### Promoting Beta to Stable
```
Current: 0.7.3b2 (beta)
Action: Create stable release
Result: 0.7.3 (removes beta suffix)
```

#### Creating Beta from Stable
```
Current: 1.0.0 (stable)
Action: Create beta with minor bump
Result: 1.1.0b1
```

## Creating a Release

### Prerequisites
1. Ensure you have push access to the repository
2. All tests must pass on the main branch
3. Verify `RELEASE_TOKEN` secret is configured in GitHub repository settings
4. Verify AWS distribution secrets are configured:
   - `AWS_DIST_ACCESS_KEY_ID`
   - `AWS_DIST_SECRET_ACCESS_KEY`
   - `AWS_DIST_REGION`
   - `AWS_DIST_BUCKET`

### Step-by-Step Process

1. **Navigate to Actions Tab**
   - Go to: https://github.com/bbernstein/lacylights-fe/actions
   - Click on "Create Release" workflow

2. **Click "Run workflow"**
   - Select branch: `main` (or appropriate branch)

3. **Configure Release Parameters**

   **For Beta Release:**
   ```
   Version bump type: patch/minor/major
   Is this a prerelease (beta) version?: ✓ checked
   Release name: (optional, leave blank for auto-generated)
   ```

   **For Stable Release:**
   ```
   Version bump type: patch/minor/major
   Is this a prerelease (beta) version?: ☐ unchecked
   Release name: (optional, leave blank for auto-generated)
   ```

4. **Run Workflow**
   - Click "Run workflow" button
   - Monitor progress in the Actions tab

## What the Workflow Does

The automated workflow performs these steps:

### 1. Version Management
- Reads current version from `package.json`
- Calculates new version based on:
  - Current version state (stable vs beta)
  - Requested version bump type
  - Whether this is a beta release
- Updates `package.json` and `package-lock.json`
- Commits version bump to repository
- Creates and pushes Git tag (e.g., `v0.7.3b1`)

### 2. Build Static Export (RPi)
- Runs `npm run build:static` to create static export
- Prepares API routes removal for static deployment
- Generates `out/` directory with static files
- Creates archive: `lacylights-fe-static-vX.Y.Z.tar.gz`
- Contains: `out/`, `package.json`, `package-lock.json`, `next.config.js`

### 3. Build Server Mode (Mac)
- Cleans previous build
- Runs `npm run build` to create production server build
- Prunes dev dependencies from `node_modules/`
- Creates archive: `lacylights-fe-server-vX.Y.Z.tar.gz`
- Contains: `src/`, `.next/`, `public/`, `node_modules/`, config files

### 4. GitHub Release
- Creates GitHub Release (draft=false)
- Sets `prerelease: true` for beta versions
- Generates release notes automatically
- Uploads both build artifacts to release

### 5. Distribution (S3 + DynamoDB)

For each artifact (static and server):

**S3 Upload:**
- Uploads `.tar.gz` to `s3://[bucket]/releases/fe-static/` or `fe-server/`
- Updates `latest.json` with version metadata:
  ```json
  {
    "version": "0.7.3b1",
    "url": "https://dist.lacylights.com/releases/fe-static/lacylights-fe-static-v0.7.3b1.tar.gz",
    "sha256": "[checksum]",
    "releaseDate": "2025-11-24T12:00:00Z",
    "isPrerelease": true,
    "fileSize": 12345678
  }
  ```

**DynamoDB Update:**
- Stores release metadata in `lacylights-releases` table
- Fields: `component`, `version`, `url`, `sha256`, `releaseDate`, `isPrerelease`, `fileSize`
- Used by update checker and installation tools

## Beta Release Strategy

### When to Create Beta Releases

Use beta releases for:
- **Testing new features** before stable release
- **Pre-production validation** on real hardware
- **Breaking changes** that need wider testing
- **Release candidates** before major versions

### Beta Release Workflow

1. **Start Beta Series**
   ```
   Current: 0.7.2 (stable)
   Create: 0.7.3b1 (first beta)
   Purpose: Test new feature X
   ```

2. **Iterate on Beta**
   ```
   Found issues in 0.7.3b1
   Create: 0.7.3b2 (increment beta)
   Fix: Addressed reported issues
   ```

   ```
   More refinements needed
   Create: 0.7.3b3 (increment beta)
   Fix: Additional improvements
   ```

3. **Promote to Stable**
   ```
   Beta testing complete
   Create: 0.7.3 (stable release)
   Removes beta suffix
   ```

### Beta Version Characteristics

- **Marked as Prerelease**: GitHub Release shows "Pre-release" badge
- **Separate from Stable**: Won't be shown as "Latest" release
- **Full Distribution**: Available via S3 and DynamoDB
- **Auto-Update**: Can be discovered by update checkers
- **isPrerelease Flag**: Set to `true` in `latest.json` and DynamoDB

## Release Checklist

Before creating a release:

- [ ] All tests pass (`npm run test:ci`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint:ci`)
- [ ] Static export builds successfully (`npm run build:static`)
- [ ] Server build works (`npm run build && npm start`)
- [ ] E2E tests pass (`npm run test:e2e:static`)
- [ ] Review commits since last release
- [ ] Decide on version bump type (major/minor/patch)
- [ ] Decide if this is a beta or stable release

After release is created:

- [ ] Verify GitHub Release page looks correct
- [ ] Check both artifacts are attached to release
- [ ] Verify S3 distribution:
  - [ ] Static build: `https://dist.lacylights.com/releases/fe-static/latest.json`
  - [ ] Server build: `https://dist.lacylights.com/releases/fe-server/latest.json`
- [ ] Verify DynamoDB entries exist for both components
- [ ] Test installation of static build (RPi)
- [ ] Test installation of server build (Mac)
- [ ] Verify SHA256 checksums match

## Verification

### Check GitHub Release
```bash
# Visit release page
https://github.com/bbernstein/lacylights-fe/releases/tag/v[VERSION]

# Verify:
- Release exists and is published
- Both artifacts are attached
- Release notes are generated
- Prerelease badge shows for beta versions
```

### Verify S3 Distribution
```bash
# Check static build
curl https://dist.lacylights.com/releases/fe-static/latest.json | jq

# Check server build
curl https://dist.lacylights.com/releases/fe-server/latest.json | jq

# Verify response includes:
# - Correct version
# - Valid download URL
# - SHA256 checksum
# - isPrerelease flag (true for beta)
```

### Verify DynamoDB
```bash
# Query for static build
aws dynamodb get-item \
  --table-name lacylights-releases \
  --key '{"component":{"S":"fe-static"},"version":{"S":"[VERSION]"}}'

# Query for server build
aws dynamodb get-item \
  --table-name lacylights-releases \
  --key '{"component":{"S":"fe-server"},"version":{"S":"[VERSION]"}}'
```

### Test Installation

**Static Build (RPi):**
```bash
# Download and extract
wget https://dist.lacylights.com/releases/fe-static/lacylights-fe-static-v[VERSION].tar.gz
tar -xzf lacylights-fe-static-v[VERSION].tar.gz
cd lacylights-fe-static

# Verify contents
ls -la out/
# Should contain: _next/, index.html, other static files

# Deploy to nginx and test
```

**Server Build (Mac):**
```bash
# Download and extract
wget https://dist.lacylights.com/releases/fe-server/lacylights-fe-server-v[VERSION].tar.gz
tar -xzf lacylights-fe-server-v[VERSION].tar.gz
cd lacylights-fe-server

# Verify contents
ls -la
# Should contain: src/, .next/, node_modules/, package.json

# Start server and test
npm start
# Visit http://localhost:3000
```

## Troubleshooting

### Release Workflow Fails

**"Permission denied" errors:**
- Verify `RELEASE_TOKEN` has `contents: write` and `pull-requests: write` permissions
- Check token hasn't expired

**"AWS credentials not found":**
- Verify AWS secrets are configured in repository settings
- Check secret names match exactly: `AWS_DIST_ACCESS_KEY_ID`, etc.

**"BUILD_ID not found after build":**
- Build failed during compilation
- Check workflow logs for build errors
- Verify dependencies are up to date
- Test build locally: `npm run build`

**"out directory not found after static build":**
- Static export failed
- Check `scripts/prepare-static-build.js` is working
- Test locally: `npm run build:static`

### Version Number Issues

**"Version already exists":**
- Tag already exists in Git
- Delete tag and retry: `git tag -d v[VERSION] && git push origin :refs/tags/v[VERSION]`

**Wrong version calculated:**
- Review current version in `package.json`
- Understand version progression (see examples above)
- Beta increments don't respect version_bump choice

### Distribution Issues

**S3 upload fails:**
- Check AWS credentials have S3 write permissions
- Verify bucket name is correct
- Check bucket policy allows uploads

**DynamoDB update fails:**
- Check AWS credentials have DynamoDB write permissions
- Verify table name is `lacylights-releases`
- Check table exists in correct region

**latest.json not updating:**
- Check S3 metadata-directive is set
- Verify CloudFront cache is invalidated (if applicable)
- Wait a few minutes and retry

### Artifact Issues

**Artifact too large:**
- Check `node_modules/` is pruned correctly (server build)
- Verify `.cache` directories are excluded
- Review what's included in archive

**Missing files in artifact:**
- Check archive contents: `tar -tzf [artifact].tar.gz | head -20`
- Verify build step completed successfully
- Check file copying commands in workflow

## Manual Release (Emergency)

If the automated workflow is unavailable, create a release manually:

```bash
# 1. Update version
npm version [patch|minor|major]  # For stable
npm version [X.Y.Zb1]            # For beta (manual version)

# 2. Build static export
npm run build:static
tar -czf lacylights-fe-static-v[VERSION].tar.gz \
  --transform 's,^,lacylights-fe-static/,' \
  out/ package.json package-lock.json next.config.js

# 3. Build server mode
npm run build
npm prune --omit=dev
tar -czf lacylights-fe-server-v[VERSION].tar.gz \
  --transform 's,^,lacylights-fe-server/,' \
  src/ .next/ public/ node_modules/ package.json package-lock.json next.config.js

# 4. Create Git tag and push
git push && git push --tags

# 5. Create GitHub release
gh release create v[VERSION] \
  --title "v[VERSION]" \
  --generate-notes \
  --prerelease  # Only for beta versions

# 6. Upload artifacts
gh release upload v[VERSION] \
  lacylights-fe-static-v[VERSION].tar.gz \
  lacylights-fe-server-v[VERSION].tar.gz

# 7. Manual S3 and DynamoDB updates required
# (Follow distribution documentation)
```

## Related Documentation

- [README.md](./README.md) - Project overview and getting started
- [STATIC_TESTING.md](./STATIC_TESTING.md) - Testing static export locally
- [Raspberry Pi Deployment Guide](https://github.com/bbernstein/lacylights-rpi)
- [GitHub Actions Workflow](.github/workflows/release.yml) - Release automation

## Support

For questions or issues with the release process:
- Open an issue: https://github.com/bbernstein/lacylights-fe/issues
- Check workflow runs: https://github.com/bbernstein/lacylights-fe/actions
