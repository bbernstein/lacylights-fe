/**
 * Utility functions for dynamic route handling in static export mode.
 *
 * These functions help extract real IDs from URLs when Next.js generates
 * placeholder routes with '__dynamic__' during static export.
 */

/**
 * Extracts a dynamic route ID from the browser URL when in static export mode.
 *
 * @param idProp - The ID prop received from Next.js (may be '__dynamic__' in static export)
 * @param routePattern - Regex pattern to match the route and capture the ID
 * @returns The extracted ID from the URL, or the original prop if not in static export mode
 *
 * @example
 * // For /scenes/abc123/edit with idProp = '__dynamic__'
 * const sceneId = extractDynamicRouteId('__dynamic__', /\/scenes\/([^\/\?#]+)/);
 * // Returns: 'abc123'
 *
 * @example
 * // For /cue-lists/xyz789 with idProp = '__dynamic__'
 * const cueListId = extractDynamicRouteId('__dynamic__', /\/cue-lists\/([^\/\?#]+)/);
 * // Returns: 'xyz789'
 */
export function extractDynamicRouteId(idProp: string, routePattern: RegExp): string {
  // Only extract from URL if we're in static export mode (idProp === '__dynamic__')
  // and we're in the browser (window is defined)
  if (idProp === '__dynamic__' && typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const match = pathname.match(routePattern);
    return match?.[1] || idProp;
  }
  return idProp;
}

/**
 * Extracts a scene ID from the URL when in static export mode.
 * Pattern matches /scenes/{sceneId}/edit or /scenes/{sceneId}
 *
 * @param sceneIdProp - The scene ID prop from Next.js
 * @returns The extracted scene ID
 */
export function extractSceneId(sceneIdProp: string): string {
  // Excludes /, ?, and # from the ID to handle query params and hash fragments
  return extractDynamicRouteId(sceneIdProp, /\/scenes\/([^\/\?#]+)/);
}

/**
 * Extracts a cue list ID from the URL when in static export mode.
 * Pattern matches /cue-lists/{cueListId}
 *
 * @param cueListIdProp - The cue list ID prop from Next.js
 * @returns The extracted cue list ID
 */
export function extractCueListId(cueListIdProp: string): string {
  // Excludes /, ?, and # from the ID to handle query params and hash fragments
  return extractDynamicRouteId(cueListIdProp, /\/cue-lists\/([^\/\?#]+)/);
}
