/**
 * Canvas coordinate and collision utilities for Scene Board
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  layoutX: number;
  layoutY: number;
  width: number;
  height: number;
}

export interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Convert percentage (0-1) to pixels (for migration)
 */
export function percentToPixel(percent: number, canvasSize: number): number {
  return Math.round(percent * canvasSize);
}

/**
 * Convert pixels to percentage (for backward compat)
 */
export function pixelToPercent(pixel: number, canvasSize: number): number {
  return pixel / canvasSize;
}

/**
 * Convert screen coordinates to canvas coordinates
 * accounting for zoom and pan
 *
 * The canvas is rendered with: transform: translate(offsetX, offsetY) scale(scale)
 * So a canvas point (cx, cy) appears at screen position:
 *   screenX = cx * scale + offsetX + rect.left
 *   screenY = cy * scale + offsetY + rect.top
 *
 * To reverse this transformation:
 *   cx = (screenX - rect.left - offsetX) / scale
 *   cy = (screenY - rect.top - offsetY) / scale
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  transform: Transform,
  canvasElement: HTMLElement,
): Point {
  const rect = canvasElement.getBoundingClientRect();
  const canvasX = (screenX - rect.left - transform.offsetX) / transform.scale;
  const canvasY = (screenY - rect.top - transform.offsetY) / transform.scale;
  return { x: canvasX, y: canvasY };
}

/**
 * Check if two rectangles collide
 */
export function checkCollision(
  rect1: Rect,
  rect2: Rect,
  padding: number = 0,
): boolean {
  return !(
    rect1.layoutX + rect1.width + padding < rect2.layoutX ||
    rect1.layoutX > rect2.layoutX + rect2.width + padding ||
    rect1.layoutY + rect1.height + padding < rect2.layoutY ||
    rect1.layoutY > rect2.layoutY + rect2.height + padding
  );
}

/**
 * Find an available position on the canvas for a new button
 */
export function findAvailablePosition(
  existingButtons: Rect[],
  canvasWidth: number,
  canvasHeight: number,
  buttonWidth: number,
  buttonHeight: number,
  gridStep: number = 250,
  padding: number = 20,
): Point | null {
  for (let y = padding; y < canvasHeight - buttonHeight; y += gridStep) {
    for (let x = padding; x < canvasWidth - buttonWidth; x += gridStep) {
      const candidate = {
        layoutX: x,
        layoutY: y,
        width: buttonWidth,
        height: buttonHeight,
      };
      const hasCollision = existingButtons.some((existing) =>
        checkCollision(candidate, existing, padding),
      );
      if (!hasCollision) {
        return { x, y };
      }
    }
  }
  return null; // No available position found
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Snap a value to the nearest grid position
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Button position data for recalibration
 */
export interface ButtonPosition {
  buttonId: string;
  layoutX: number;
  layoutY: number;
  width: number;
  height: number;
}

/**
 * Result of recalibration calculation
 */
export interface RecalibrationResult {
  needsRecalibration: boolean;
  offsetX: number;
  offsetY: number;
  positions: ButtonPosition[];
}

/**
 * Calculate coordinate recalibration to normalize button positions.
 * Recalibrates only when buttons are out of bounds (minX < 0, minY < 0,
 * maxX > canvasWidth, maxY > canvasHeight) or have drifted significantly
 * from the origin (minX or minY > drift threshold).
 * When recalibration is needed, shifts buttons so leftmost is at X=0 and topmost is at Y=0.
 * This prevents buttons from spreading too far across the canvas while avoiding
 * unnecessary database writes when buttons are already in a valid position.
 *
 * @param buttons All button positions (including dragged ones)
 * @param canvasWidth Canvas width in pixels
 * @param canvasHeight Canvas height in pixels
 * @returns Recalibration result with offsets and adjusted positions, or null if buttons don't fit.
 *          When null is returned, the caller should clamp button positions to fit within canvas bounds
 *          and save those clamped positions to preserve user intent as much as possible.
 */
export function recalibrateButtonPositions(
  buttons: ButtonPosition[],
  canvasWidth: number,
  canvasHeight: number,
): RecalibrationResult | null {
  if (buttons.length === 0) {
    return {
      needsRecalibration: false,
      offsetX: 0,
      offsetY: 0,
      positions: [],
    };
  }

  // Calculate bounding box of all buttons
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  buttons.forEach((btn) => {
    minX = Math.min(minX, btn.layoutX);
    minY = Math.min(minY, btn.layoutY);
    maxX = Math.max(maxX, btn.layoutX + btn.width);
    maxY = Math.max(maxY, btn.layoutY + btn.height);
  });

  // Only normalize when buttons are out of bounds or have drifted significantly from origin
  // This avoids unnecessary database writes when buttons are already in a valid position
  const DRIFT_THRESHOLD = 100;

  const isOutOfBounds =
    minX < 0 || minY < 0 || maxX > canvasWidth || maxY > canvasHeight;

  const hasSignificantDrift = minX > DRIFT_THRESHOLD || minY > DRIFT_THRESHOLD;

  // If everything is already within bounds and close to the origin, skip recalibration
  if (!isOutOfBounds && !hasSignificantDrift) {
    return {
      needsRecalibration: false,
      offsetX: 0,
      offsetY: 0,
      positions: buttons,
    };
  }

  // Normalize: shift so leftmost button is at X=0 and topmost is at Y=0
  // This prevents buttons from spreading too far across the canvas when
  // they are out of bounds or have drifted significantly
  const offsetX = -minX; // Shift to bring leftmost to 0
  const offsetY = -minY; // Shift to bring topmost to 0

  // Check if buttons fit within canvas after normalization
  const normalizedMaxX = maxX + offsetX;
  const normalizedMaxY = maxY + offsetY;

  if (normalizedMaxX > canvasWidth || normalizedMaxY > canvasHeight) {
    // Buttons are too spread out to fit within canvas
    return null;
  }

  const needsRecalibration = true; // If we get here, we need to recalibrate

  // Apply offsets to all buttons
  const recalibratedPositions = buttons.map((btn) => ({
    ...btn,
    layoutX: btn.layoutX + offsetX,
    layoutY: btn.layoutY + offsetY,
  }));

  // Verify all positions are within bounds (sanity check)
  const allWithinBounds = recalibratedPositions.every(
    (btn) =>
      btn.layoutX >= 0 &&
      btn.layoutY >= 0 &&
      btn.layoutX + btn.width <= canvasWidth &&
      btn.layoutY + btn.height <= canvasHeight,
  );

  if (!allWithinBounds) {
    return null;
  }

  return {
    needsRecalibration,
    offsetX,
    offsetY,
    positions: recalibratedPositions,
  };
}
