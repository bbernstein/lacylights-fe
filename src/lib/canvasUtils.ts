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
 * Calculate coordinate recalibration when buttons are dragged beyond canvas bounds.
 * Returns adjusted positions for all buttons to fit within canvas while maintaining
 * relative positions.
 *
 * @param buttons All button positions (including dragged ones)
 * @param canvasWidth Canvas width in pixels
 * @param canvasHeight Canvas height in pixels
 * @returns Recalibration result with offsets and adjusted positions, or null if buttons don't fit
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

  // Calculate required offsets to bring everything within bounds
  let offsetX = 0;
  let offsetY = 0;

  // Check if any button is beyond left edge (x < 0)
  if (minX < 0) {
    offsetX = -minX; // Shift right by the negative amount
  }

  // Check if any button is beyond top edge (y < 0)
  if (minY < 0) {
    offsetY = -minY; // Shift down by the negative amount
  }

  // Check if any button is beyond right edge
  if (maxX > canvasWidth) {
    const excessRight = maxX - canvasWidth;
    // Can we shift left?
    if (minX - excessRight < 0) {
      // Would push buttons beyond left edge - doesn't fit
      return null;
    }
    offsetX = -excessRight; // Shift left by excess amount
  }

  // Check if any button is beyond bottom edge
  if (maxY > canvasHeight) {
    const excessBottom = maxY - canvasHeight;
    // Can we shift up?
    if (minY - excessBottom < 0) {
      // Would push buttons beyond top edge - doesn't fit
      return null;
    }
    offsetY = -excessBottom; // Shift up by excess amount
  }

  const needsRecalibration = offsetX !== 0 || offsetY !== 0;

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
