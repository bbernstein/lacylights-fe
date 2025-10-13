# Testing Static Export Locally

This document explains how to test the production static export locally before deploying to Raspberry Pi.

## The Problem

The Next.js dev server (`npm run dev`) handles routing dynamically, which is different from how the static export works in production with nginx. This means:

- **Dev mode**: Next.js server handles all routing dynamically
- **Production**: Static HTML files served by nginx with specific routing rules

This can lead to behavior differences that only appear in production, making it difficult to test the static export locally.

## The Solution

We've created a custom static file server that mimics the nginx routing used in production on Raspberry Pi.

### Quick Start

**Option 1: Build and serve static export (recommended for testing)**
```bash
npm run dev:static
```

This will:
1. Build the static export (`npm run build`)
2. Start the static file server on http://localhost:3000

**Option 2: Serve existing build**
```bash
# First, build if you haven't already
npm run build

# Then serve the static files
npm run serve:static
```

### What's Different?

The static file server (`scripts/serve-static.js`) replicates the nginx configuration:

1. **Exact matches for list pages**
   - `/cue-lists/` → serves `/cue-lists/index.html`
   - `/player/` → serves `/player/index.html`

2. **Dynamic route handling**
   - `/cue-lists/[id]` → serves `/cue-lists/__dynamic__/index.html`
   - `/player/[id]` → serves `/player/__dynamic__/index.html`

3. **Static file caching**
   - `/_next/static/*` files served with cache headers

4. **SPA fallback**
   - Unmatched routes fall back to `/index.html`

### Testing Workflow

```bash
# 1. Make code changes
# 2. Build and test static export
npm run dev:static

# 3. Test navigation:
# - Go to http://localhost:3000/cue-lists/
# - Click "open cue list" button
# - Verify it loads the cue list player correctly
# - Test edit mode: http://localhost:3000/cue-lists/[id]?mode=edit

# 4. If everything works, it should work the same on Raspberry Pi
```

### When to Use Each Mode

**Use `npm run dev` when:**
- Developing new features
- Making quick changes with hot reload
- Not concerned with routing behavior

**Use `npm run dev:static` when:**
- Testing production routing behavior
- Verifying static export functionality
- Before deploying to Raspberry Pi
- Debugging navigation issues that only occur in production

### Server Configuration

The static server can be configured with environment variables:

```bash
# Use a different port
PORT=8080 npm run serve:static
```

### Troubleshooting

**Issue**: Server shows 404 for routes that work in dev mode

**Solution**: Check that the route generates a static HTML file:
```bash
ls -la out/cue-lists/
ls -la out/cue-lists/__dynamic__/
```

If the files are missing, check:
1. `next.config.ts` has `output: 'export'`
2. Route has `generateStaticParams()` function
3. Route doesn't use server-only features

**Issue**: Changes not reflected after running `npm run dev:static`

**Solution**: The script rebuilds automatically, but you may need to hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R) to clear cached files.

### Comparing with Nginx

The nginx configuration on Raspberry Pi (simplified):

```nginx
location = /cue-lists/ {
    try_files /cue-lists/index.html =404;
}

location ~* ^/cue-lists/[^/]+$ {
    try_files /cue-lists/__dynamic__/index.html =404;
}

location / {
    try_files $uri $uri/ $uri.html /index.html;
}
```

The static server script (`scripts/serve-static.js`) replicates this behavior.

## Next Steps

After verifying locally with `npm run dev:static`, you can confidently deploy to Raspberry Pi knowing the routing behavior will be identical.

See [DEPLOYMENT.md](https://github.com/bbernstein/lacylights-node/blob/main/deploy/DEPLOYMENT.md) for Raspberry Pi deployment instructions.
