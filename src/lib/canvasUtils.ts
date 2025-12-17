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
  canvasElement: HTMLElement
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
  padding: number = 0
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
  padding: number = 20
): Point | null {
  for (let y = padding; y < canvasHeight - buttonHeight; y += gridStep) {
    for (let x = padding; x < canvasWidth - buttonWidth; x += gridStep) {
      const candidate = { layoutX: x, layoutY: y, width: buttonWidth, height: buttonHeight };
      const hasCollision = existingButtons.some(existing =>
        checkCollision(candidate, existing, padding)
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
