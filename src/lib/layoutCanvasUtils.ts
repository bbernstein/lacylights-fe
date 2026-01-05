/**
 * Canvas coordinate utilities for 2D Layout Editor
 *
 * This module provides coordinate transformation functions for the fixture layout
 * canvas, which uses a virtual canvas coordinate system (default 2000x2000 pixels).
 *
 * Key concepts:
 * - Virtual Canvas: A fixed-size coordinate space where fixtures are positioned
 * - Screen Space: The actual visible area in the browser window
 * - Viewport: Transforms virtual canvas coordinates to screen coordinates (pan + zoom)
 *
 * Unlike the Scene Board, fixtures in the 2D Layout maintain a FIXED screen size
 * (FIXTURE_SIZE = 80px) regardless of zoom level. Only their positions scale with zoom.
 */

/**
 * Fixed fixture size in screen pixels (does not scale with zoom)
 */
export const FIXTURE_SIZE = 80;

/**
 * Default virtual canvas dimensions (matches Scene Board)
 */
export const DEFAULT_CANVAS_WIDTH = 2000;
export const DEFAULT_CANVAS_HEIGHT = 2000;

/**
 * Viewport transform state
 */
export interface ViewportTransform {
  x: number; // Pan offset X (in screen pixels)
  y: number; // Pan offset Y (in screen pixels)
  scale: number; // Zoom scale factor
}

/**
 * A point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Convert screen coordinates to virtual canvas pixel coordinates.
 *
 * Given a point on the screen (e.g., from a mouse/touch event), this function
 * calculates the corresponding position in the virtual canvas coordinate system.
 *
 * @param screenX - Screen X coordinate (relative to canvas element)
 * @param screenY - Screen Y coordinate (relative to canvas element)
 * @param viewport - Current viewport transform (pan and zoom)
 * @returns Point in virtual canvas coordinates (pixels)
 */
export function screenToPixel(
  screenX: number,
  screenY: number,
  viewport: ViewportTransform,
): Point {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale,
  };
}

/**
 * Convert virtual canvas pixel coordinates to screen coordinates.
 *
 * Given a position in the virtual canvas (e.g., a fixture's layoutX/layoutY),
 * this function calculates where it should appear on screen.
 *
 * @param pixelX - Virtual canvas X coordinate (pixels)
 * @param pixelY - Virtual canvas Y coordinate (pixels)
 * @param viewport - Current viewport transform (pan and zoom)
 * @returns Point in screen coordinates
 */
export function pixelToScreen(
  pixelX: number,
  pixelY: number,
  viewport: ViewportTransform,
): Point {
  return {
    x: pixelX * viewport.scale + viewport.x,
    y: pixelY * viewport.scale + viewport.y,
  };
}

/**
 * Check if a value appears to be a normalized (0-1) coordinate.
 *
 * Used for backward compatibility detection during the migration period.
 * The backend auto-converts normalized coordinates to pixels in API responses,
 * but this function provides client-side detection as a fallback.
 *
 * Uses strict inequality (> 0 and < 1) to avoid false positives for pixel
 * coordinates at exactly 0 or 1.
 *
 * EDGE CASE: Fixtures legitimately positioned at exactly 0.0 or 1.0 in normalized
 * coordinates will NOT be detected as normalized. This is an accepted trade-off.
 *
 * @param value - The coordinate value to check
 * @returns true if the value appears to be normalized (strictly between 0 and 1)
 */
export function isNormalizedCoordinate(value: number): boolean {
  return value > 0 && value < 1;
}

/**
 * Convert normalized (0-1) coordinates to pixel coordinates.
 *
 * @param normalizedX - Normalized X coordinate (0-1)
 * @param normalizedY - Normalized Y coordinate (0-1)
 * @param canvasWidth - Virtual canvas width in pixels
 * @param canvasHeight - Virtual canvas height in pixels
 * @returns Point in pixel coordinates
 */
export function normalizedToPixels(
  normalizedX: number,
  normalizedY: number,
  canvasWidth: number = DEFAULT_CANVAS_WIDTH,
  canvasHeight: number = DEFAULT_CANVAS_HEIGHT,
): Point {
  return {
    x: normalizedX * canvasWidth,
    y: normalizedY * canvasHeight,
  };
}

/**
 * Clamp a fixture position to stay within canvas bounds.
 *
 * Ensures the fixture center stays at least FIXTURE_SIZE/2 away from edges
 * so the fixture body is always fully visible.
 *
 * @param x - X position in pixel coordinates
 * @param y - Y position in pixel coordinates
 * @param canvasWidth - Virtual canvas width
 * @param canvasHeight - Virtual canvas height
 * @returns Clamped position
 */
export function clampToCanvas(
  x: number,
  y: number,
  canvasWidth: number = DEFAULT_CANVAS_WIDTH,
  canvasHeight: number = DEFAULT_CANVAS_HEIGHT,
): Point {
  const half = FIXTURE_SIZE / 2;
  return {
    x: Math.max(half, Math.min(canvasWidth - half, x)),
    y: Math.max(half, Math.min(canvasHeight - half, y)),
  };
}

/**
 * Calculate fixture bounds in canvas coordinates.
 *
 * @param x - Fixture center X in pixel coordinates
 * @param y - Fixture center Y in pixel coordinates
 * @returns Bounds object with left, top, right, bottom
 */
export function getFixtureBounds(
  x: number,
  y: number,
): { left: number; top: number; right: number; bottom: number } {
  const half = FIXTURE_SIZE / 2;
  return {
    left: x - half,
    top: y - half,
    right: x + half,
    bottom: y + half,
  };
}

/**
 * Check if a screen point is within a fixture's bounds.
 *
 * Since fixtures have FIXED screen size (not scaled with zoom), hit detection
 * uses the inverse of the zoom scale for the hit radius.
 *
 * @param screenX - Screen X coordinate
 * @param screenY - Screen Y coordinate
 * @param fixtureX - Fixture center X in pixel coordinates
 * @param fixtureY - Fixture center Y in pixel coordinates
 * @param viewport - Current viewport transform
 * @returns true if the point is within the fixture
 */
export function isPointInFixture(
  screenX: number,
  screenY: number,
  fixtureX: number,
  fixtureY: number,
  viewport: ViewportTransform,
): boolean {
  // Convert fixture position to screen coordinates
  const fixtureScreen = pixelToScreen(fixtureX, fixtureY, viewport);

  // Fixtures have fixed screen size (not scaled with zoom)
  const halfSize = FIXTURE_SIZE / 2;

  return (
    screenX >= fixtureScreen.x - halfSize &&
    screenX <= fixtureScreen.x + halfSize &&
    screenY >= fixtureScreen.y - halfSize &&
    screenY <= fixtureScreen.y + halfSize
  );
}

/**
 * Calculate auto-layout positions for fixtures in a grid pattern.
 *
 * Used when fixtures don't have saved positions.
 *
 * @param fixtureCount - Number of fixtures to position
 * @param canvasWidth - Virtual canvas width
 * @param canvasHeight - Virtual canvas height
 * @returns Array of positions (one per fixture index)
 */
export function calculateAutoLayoutPositions(
  fixtureCount: number,
  canvasWidth: number = DEFAULT_CANVAS_WIDTH,
  canvasHeight: number = DEFAULT_CANVAS_HEIGHT,
): Point[] {
  if (fixtureCount === 0) return [];

  const gridCols = Math.ceil(Math.sqrt(fixtureCount));
  const gridRows = Math.ceil(fixtureCount / gridCols);

  const cellWidth = canvasWidth / gridCols;
  const cellHeight = canvasHeight / gridRows;

  const positions: Point[] = [];

  for (let i = 0; i < fixtureCount; i++) {
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);

    positions.push({
      x: (col + 0.5) * cellWidth, // Center in cell
      y: (row + 0.5) * cellHeight,
    });
  }

  return positions;
}

/**
 * Snap a position to the nearest grid point.
 *
 * @param x - X position
 * @param y - Y position
 * @param gridSize - Grid cell size in pixels
 * @returns Snapped position
 */
export function snapToGrid(x: number, y: number, gridSize: number): Point {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}
