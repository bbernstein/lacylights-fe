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
 * Fixtures scale with zoom level (80px at 1x zoom), matching Scene Board behavior.
 * Both fixture positions AND sizes scale together, keeping proportions consistent.
 */

import type { FixtureInstance } from "@/types";

/**
 * Base fixture size in pixels (scales with zoom: 80px at 1x zoom)
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
 * This utility is provided for:
 * - Collision detection between fixtures
 * - Marquee selection bounds checking
 * - Future features like fixture overlap warnings
 *
 * @param x - Fixture center X in pixel coordinates
 * @param y - Fixture center Y in pixel coordinates
 * @returns Bounds object with left, top, right, bottom in pixel coordinates
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
 * Fixtures scale with zoom (80px at 1x zoom), so hit detection
 * uses the scaled fixture size.
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

  // Fixtures scale with zoom (80px at 1x zoom)
  const halfSize = (FIXTURE_SIZE * viewport.scale) / 2;

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

export interface FixturePosition {
  fixtureId: string;
  x: number; // Pixel coordinates in virtual canvas; valid fixture centers are clamped to FIXTURE_SIZE/2 .. canvasWidth - FIXTURE_SIZE/2
  y: number; // Pixel coordinates in virtual canvas; valid fixture centers are clamped to FIXTURE_SIZE/2 .. canvasHeight - FIXTURE_SIZE/2
  rotation?: number; // Degrees, for beam direction
}

/**
 * Fixture-position bookkeeping that the canvas keeps alongside its positions:
 * which fixtures have been initialized and their last-saved (database)
 * positions.
 */
export interface PositionSync {
  initializedIds: Set<string>;
  savedPositions: Map<string, FixturePosition>;
  hasUnsavedChanges?: boolean; // Set only when a database update was processed
}

/**
 * Reconcile the canvas's fixture positions with the current fixtures prop.
 * Initializes new fixtures (from their saved layout or auto-layout), drops
 * removed ones, and accepts database position changes (undo/redo) for
 * fixtures without unsaved local edits.
 *
 * Pure: it never mutates its arguments, so it is safe to call from a React
 * state updater that React may replay. The new ref values are returned in
 * `sync` for the caller to apply after commit.
 */
export function reconcileFixturePositions(
  prevPositions: Map<string, FixturePosition>,
  fixtures: FixtureInstance[],
  baseline: Pick<PositionSync, "initializedIds" | "savedPositions">,
  canvasWidth: number,
  canvasHeight: number,
): { positions: Map<string, FixturePosition>; sync: PositionSync } {
  const currentFixtureIds = new Set(fixtures.map((f) => f.id));
  const positions = new Map(prevPositions); // Start with existing positions
  const initializedIds = new Set(baseline.initializedIds);
  const saved = new Map(baseline.savedPositions);

  // Clean up saved positions for removed fixtures
  for (const [fixtureId] of saved) {
    if (!currentFixtureIds.has(fixtureId)) {
      saved.delete(fixtureId);
    }
  }

  // Remove positions for fixtures that no longer exist
  for (const [fixtureId] of positions) {
    if (!currentFixtureIds.has(fixtureId)) {
      positions.delete(fixtureId);
      initializedIds.delete(fixtureId);
    }
  }

  // A fixture counts as initialized only if it is also present in the
  // positions this updater was given
  const isInitialized = (fixtureId: string) =>
    initializedIds.has(fixtureId) && positions.has(fixtureId);

  // Pre-calculate auto-layout positions for fixtures without saved positions
  const fixturesNeedingAutoLayout = fixtures.filter(
    (f) =>
      !isInitialized(f.id) &&
      (f.layoutX === null || f.layoutX === undefined || f.layoutY === null || f.layoutY === undefined)
  );
  const autoLayoutPositions = calculateAutoLayoutPositions(
    fixturesNeedingAutoLayout.length,
    canvasWidth,
    canvasHeight
  );
  let autoLayoutIndex = 0;

  // Track whether any database-triggered position update occurred
  // Used to determine if we need to recompute hasUnsavedChanges after processing
  let hadDatabaseUpdate = false;

  fixtures.forEach((fixture) => {
    // Check if already initialized
    if (isInitialized(fixture.id)) {
      // For already-initialized fixtures, check if database position changed
      // This handles undo/redo updates from the backend
      const currentPos = positions.get(fixture.id);
      const savedPos = saved.get(fixture.id);

      if (
        fixture.layoutX !== null &&
        fixture.layoutX !== undefined &&
        fixture.layoutY !== null &&
        fixture.layoutY !== undefined &&
        savedPos &&
        currentPos
      ) {
        // Check if database position differs from what we last saved
        const dbX = fixture.layoutX;
        const dbY = fixture.layoutY;
        const dbRotation = fixture.layoutRotation ?? 0;

        const dbChanged =
          dbX !== savedPos.x ||
          dbY !== savedPos.y ||
          dbRotation !== (savedPos.rotation ?? 0);

        // Check if local position has unsaved changes (user is actively dragging).
        // This prevents undo/redo from overwriting user's in-progress drag.
        // The comparison uses savedPositions (last synced to database) as the baseline:
        // - If currentPos === savedPos: no local changes, safe to accept database update
        // - If currentPos !== savedPos: user has unsaved changes, preserve their work
        const hasLocalChanges =
          currentPos.x !== savedPos.x ||
          currentPos.y !== savedPos.y ||
          (currentPos.rotation ?? 0) !== (savedPos.rotation ?? 0);

        // Check if database position now matches current local position.
        // This can happen when undo/redo reverts database to match user's current layout.
        const dbMatchesCurrent =
          currentPos.x === dbX &&
          currentPos.y === dbY &&
          (currentPos.rotation ?? 0) === dbRotation;

        // Update local state only if:
        // 1. Database changed (from undo/redo or another client)
        // 2a. User doesn't have local unsaved changes (not mid-drag), OR
        // 2b. Database now matches current local position (clear stale "unsaved" indication)
        if (dbChanged) {
          hadDatabaseUpdate = true;
          if (!hasLocalChanges) {
            // No local changes: accept database update into both positions and savedPositions
            const newPosition: FixturePosition = {
              fixtureId: fixture.id,
              x: dbX,
              y: dbY,
              rotation: dbRotation,
            };
            positions.set(fixture.id, newPosition);
            saved.set(fixture.id, { ...newPosition });
          } else if (dbMatchesCurrent) {
            // Local position already matches database: update savedPositions to clear
            // stale "unsaved" state without overwriting user's current position
            saved.set(fixture.id, { ...currentPos });
          }
          // If hasLocalChanges && !dbMatchesCurrent: preserve user's unsaved work
        }
      }
      return;
    }

    // Check if fixture has saved position in database
    if (
      fixture.layoutX !== null &&
      fixture.layoutX !== undefined &&
      fixture.layoutY !== null &&
      fixture.layoutY !== undefined
    ) {
      let x = fixture.layoutX;
      let y = fixture.layoutY;

      // Backward compatibility: detect and convert normalized coordinates
      // The backend should already convert these, but this is a safety net.
      // Check each axis independently to handle edge cases like (0.5, 0.0) or (1.0, 0.5).
      // Values in the normalized range [0, 1] are treated as normalized coordinates.
      //
      // KNOWN LIMITATION: Pixel positions 0 or 1 would be incorrectly treated as normalized.
      // In practice this is very unlikely since:
      // 1. Fixtures are clamped to FIXTURE_SIZE/2 (40px) minimum
      // 2. After migration, all coordinates should be in pixel range
      // 3. The backend migration script handles the authoritative conversion
      const xIsNormalized =
        isNormalizedCoordinate(x) || x === 0 || x === 1;
      const yIsNormalized =
        isNormalizedCoordinate(y) || y === 0 || y === 1;

      if (xIsNormalized || yIsNormalized) {
        // Log when conversion is applied to help identify migration issues
        if (process.env.NODE_ENV === "development") {
          console.debug(
            `[LayoutCanvas] Converting legacy coordinates for fixture ${fixture.id}: (${fixture.layoutX}, ${fixture.layoutY}) → pixel space`
          );
        }
        if (xIsNormalized) {
          x = x * canvasWidth;
        }
        if (yIsNormalized) {
          y = y * canvasHeight;
        }
        // Clamp converted coordinates to valid canvas bounds
        const clamped = clampToCanvas(x, y, canvasWidth, canvasHeight);
        x = clamped.x;
        y = clamped.y;
      }

      const position: FixturePosition = {
        fixtureId: fixture.id,
        x,
        y,
        rotation: fixture.layoutRotation ?? 0,
      };
      positions.set(fixture.id, position);
      // Track this as the saved position (from database)
      saved.set(fixture.id, { ...position });
    } else {
      // Use auto-layout for new fixtures without saved positions (pixel coordinates)
      const autoPos = autoLayoutPositions[autoLayoutIndex] || { x: canvasWidth / 2, y: canvasHeight / 2 };
      positions.set(fixture.id, {
        fixtureId: fixture.id,
        x: autoPos.x,
        y: autoPos.y,
        rotation: 0,
      });
      // Note: auto-layout positions are NOT added to savedPositions
      // They will be tracked as unsaved changes

      autoLayoutIndex++;
    }

    // Mark this fixture as initialized
    initializedIds.add(fixture.id);
  });

  // After processing all fixtures, if there was a database update, recompute
  // hasUnsavedChanges by comparing current positions with savedPositions.
  // This ensures the Save button state is correct after undo/redo operations.
  // Only recompute when database updates occurred to avoid interfering with
  // initial auto-layout (which intentionally creates unsaved positions).
  let anyUnsavedChanges: boolean | undefined;
  if (hadDatabaseUpdate) {
    anyUnsavedChanges = false;
    for (const [fixtureId, pos] of positions) {
      const savedPos = saved.get(fixtureId);
      if (!savedPos) {
        // New fixture without saved position = unsaved change
        anyUnsavedChanges = true;
        break;
      }
      if (
        pos.x !== savedPos.x ||
        pos.y !== savedPos.y ||
        (pos.rotation ?? 0) !== (savedPos.rotation ?? 0)
      ) {
        anyUnsavedChanges = true;
        break;
      }
    }
  }

  return {
    positions,
    sync: {
      initializedIds,
      savedPositions: saved,
      hasUnsavedChanges: anyUnsavedChanges,
    },
  };
}
