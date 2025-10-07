# Next.js Static Export Notes

## Current Issue: Dynamic Player Route

**Problem**: The `/player/[cueListId]` route uses dynamic parameters that cannot be fully static at build time.

**Next.js Limitation**: Static export (`output: 'export'`) requires all dynamic routes to have `generateStaticParams()` that returns all possible parameter values at build time.

## Solutions

### Option 1: nginx Fallback Routing (Recommended for MVP)

Configure nginx to serve the same HTML file for all `/player/*` routes. The client-side JavaScript will handle extracting the cue list ID from the URL.

**nginx configuration:**
```nginx
# Handle player routes - serve the same file for all player pages
location ~* ^/player/.+ {
    try_files /player/__dynamic__/index.html /player/__dynamic__.html =404;
}
```

### Option 2: Query Parameter Approach

Convert the route from `/player/[cueListId]` to `/player?id=[cueListId]`.

**Changes needed:**
- Move `src/app/(standalone)/player/[cueListId]/page.tsx` to `src/app/(standalone)/player/page.tsx`
- Update components to read `id` from query params
- Update all links to use query parameter format

### Option 3: Build-Time Cue List Fetching

Fetch all cue lists at build time and generate static pages for each.

**Implementation:**
```typescript
export async function generateStaticParams() {
  // Fetch from GraphQL API during build
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query { cueLists { id } }`
    })
  });

  const { data } = await response.json();
  return data.cueLists.map((list: { id: string }) => ({
    cueListId: list.id
  }));
}
```

**Limitations:**
- Requires backend to be running during build
- New cue lists added after build won't have pages
- Increases build time

## Current Status

For the MVP deployment, we're using **Option 1** (nginx fallback routing). This provides the best balance of:
- ✅ Simple implementation
- ✅ Works with any cue list ID
- ✅ No build-time dependencies
- ✅ Fast builds

## Implementation

The `generateStaticParams()` returns a placeholder value `__dynamic__`, and nginx is configured to serve this page for all `/player/*` routes. The CueListPlayer component handles the actual cue list ID extraction from the URL on the client side.
