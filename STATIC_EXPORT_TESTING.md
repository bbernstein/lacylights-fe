# Static Export Testing

## Problem

The frontend app uses Next.js static export for Raspberry Pi deployment. Dynamic routes (like `/scenes/{id}/edit`) work in dev mode but failed in static export mode, redirecting to `/fixtures/`.

## Root Cause

1. nginx on Raspberry Pi lacked handlers for dynamic routes
2. Unmatched routes fell back to `/index.html`
3. `/index.html` (from `/`) contains `redirect('/fixtures')`
4. All dynamic routes redirected to `/fixtures/`

## Solution

### 1. Added E2E Testing (Playwright)

**Install:**
```bash
npm install --save-dev @playwright/test playwright
npx playwright install chromium
```

**Run tests:**
```bash
# Test static export mode (builds first)
npm run test:e2e:static

# Test dev mode
npm run test:e2e:dev

# All tests (unit + E2E)
npm run test:all
```

**Test files:**
- `playwright.config.ts` - Playwright configuration
- `e2e/dynamic-routes.spec.ts` - Tests for dynamic route navigation
- `scripts/serve-static.js` - Local static server that mimics nginx routing

### 2. Updated nginx Configuration

Added handlers for all dynamic routes in `lacylights-node/deploy/nginx/lacylights.conf`:

```nginx
# Scene editor: /scenes/{sceneId}/edit
location ~* ^/scenes/[^/]+/edit/?$ {
    try_files /scenes/__dynamic__/edit/index.html =404;
}

# Cue list detail: /cue-lists/{id}
location ~* ^/cue-lists/[^/]+/?$ {
    try_files /cue-lists/__dynamic__/index.html =404;
}

# Player: /player/{cueListId}
location ~* ^/player/[^/]+/?$ {
    try_files /player/__dynamic__/index.html =404;
}
```

## How It Works

### Static Export + Dynamic Routes

1. **Build time**: `generateStaticParams()` creates placeholder routes:
   - `/scenes/__dynamic__/edit/index.html`
   - `/cue-lists/__dynamic__/index.html`
   - `/player/__dynamic__/index.html`

2. **Runtime**: Client-side code extracts real IDs from URL:
   - `src/utils/routeUtils.ts` - `extractSceneId()`, `extractCueListId()`
   - These check if `idProp === '__dynamic__'` and extract from `window.location.pathname`

3. **Server**: nginx serves the `__dynamic__` placeholder for any matching route

## Testing During Development

**IMPORTANT**: Always test static export mode before deploying!

```bash
# Build and serve locally
npm run build && npm run serve:static

# Or combined:
npm run dev:static

# Then run E2E tests
npm run test:e2e:static
```

The `serve-static.js` script mimics nginx behavior, so local testing catches routing issues before deployment.

## Files Modified

### Frontend (lacylights-fe)
- `package.json` - Added Playwright and test scripts
- `playwright.config.ts` - Playwright configuration
- `e2e/dynamic-routes.spec.ts` - E2E tests
- `src/app/(main)/scenes/[sceneId]/edit/page.tsx` - `dynamicParams: false`
- `src/app/(standalone)/player/[cueListId]/page.tsx` - `dynamicParams: false`

### Backend (lacylights-node)
- `deploy/nginx/lacylights.conf` - Added dynamic route handlers

## Deployment

The deployment script (`lacylights-node/deploy/deploy.sh`) automatically:
1. Builds frontend with static export
2. Copies nginx config
3. Reloads nginx

After deployment, dynamic routes work correctly on the Raspberry Pi.
