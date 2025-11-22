import {
  percentToPixel,
  pixelToPercent,
  checkCollision,
  findAvailablePosition,
  clamp,
  snapToGrid,
  Rect,
} from '../canvasUtils';

describe('canvasUtils', () => {
  describe('percentToPixel', () => {
    it('should convert percentage to pixels', () => {
      expect(percentToPixel(0.5, 2000)).toBe(1000);
      expect(percentToPixel(0.1, 2000)).toBe(200);
      expect(percentToPixel(1.0, 2000)).toBe(2000);
      expect(percentToPixel(0, 2000)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(percentToPixel(0.333, 2000)).toBe(666);
      expect(percentToPixel(0.666, 2000)).toBe(1332);
    });
  });

  describe('pixelToPercent', () => {
    it('should convert pixels to percentage', () => {
      expect(pixelToPercent(1000, 2000)).toBe(0.5);
      expect(pixelToPercent(200, 2000)).toBe(0.1);
      expect(pixelToPercent(2000, 2000)).toBe(1.0);
      expect(pixelToPercent(0, 2000)).toBe(0);
    });
  });

  describe('checkCollision', () => {
    it('should detect collision when rectangles overlap', () => {
      const rect1: Rect = { layoutX: 0, layoutY: 0, width: 100, height: 100 };
      const rect2: Rect = { layoutX: 50, layoutY: 50, width: 100, height: 100 };
      expect(checkCollision(rect1, rect2)).toBe(true);
    });

    it('should not detect collision when rectangles do not overlap', () => {
      const rect1: Rect = { layoutX: 0, layoutY: 0, width: 100, height: 100 };
      const rect2: Rect = { layoutX: 200, layoutY: 200, width: 100, height: 100 };
      expect(checkCollision(rect1, rect2)).toBe(false);
    });

    it('should detect collision at exact edges without padding', () => {
      const rect1: Rect = { layoutX: 0, layoutY: 0, width: 100, height: 100 };
      const rect2: Rect = { layoutX: 100, layoutY: 0, width: 100, height: 100 };
      // Rectangles touching at edges are considered colliding (expected behavior).
      // This design choice ensures that UI elements (e.g., buttons) do not appear to overlap visually,
      // and avoids ambiguous cases where elements are flush but not truly separated.
      expect(checkCollision(rect1, rect2)).toBe(true);
    });

    it('should respect padding parameter', () => {
      const rect1: Rect = { layoutX: 0, layoutY: 0, width: 100, height: 100 };
      const rect2: Rect = { layoutX: 105, layoutY: 0, width: 100, height: 100 };
      expect(checkCollision(rect1, rect2, 10)).toBe(true);
      expect(checkCollision(rect1, rect2, 0)).toBe(false);
    });
  });

  describe('findAvailablePosition', () => {
    it('should find first available position in empty canvas', () => {
      const pos = findAvailablePosition([], 2000, 2000, 200, 120, 250, 20);
      expect(pos).toEqual({ x: 20, y: 20 });
    });

    it('should find next available position when first is occupied', () => {
      const existingButtons: Rect[] = [
        { layoutX: 20, layoutY: 20, width: 200, height: 120 },
      ];
      const pos = findAvailablePosition(
        existingButtons,
        2000,
        2000,
        200,
        120,
        250,
        20
      );
      expect(pos).toEqual({ x: 270, y: 20 });
    });

    it('should return null when no position available', () => {
      // Fill the entire canvas
      const existingButtons: Rect[] = [];
      for (let y = 0; y < 2000; y += 120) {
        for (let x = 0; x < 2000; x += 200) {
          existingButtons.push({ layoutX: x, layoutY: y, width: 200, height: 120 });
        }
      }
      const pos = findAvailablePosition(
        existingButtons,
        2000,
        2000,
        200,
        120,
        250,
        20
      );
      expect(pos).toBeNull();
    });

    it('should skip to next row when current row is full', () => {
      const existingButtons: Rect[] = [];
      // Fill first row
      for (let x = 20; x < 2000 - 200; x += 250) {
        existingButtons.push({ layoutX: x, layoutY: 20, width: 200, height: 120 });
      }
      const pos = findAvailablePosition(
        existingButtons,
        2000,
        2000,
        200,
        120,
        250,
        20
      );
      expect(pos?.y).toBe(270); // Next row
    });
  });

  describe('clamp', () => {
    it('should clamp value to min', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(5, 10, 100)).toBe(10);
    });

    it('should clamp value to max', () => {
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(95, 0, 90)).toBe(90);
    });

    it('should return value when within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(100, 0, 100)).toBe(100);
    });
  });

  describe('snapToGrid', () => {
    it('should snap to nearest grid position', () => {
      expect(snapToGrid(0, 50)).toBe(0);
      expect(snapToGrid(25, 50)).toBe(50);
      expect(snapToGrid(75, 50)).toBe(100);
      expect(snapToGrid(100, 50)).toBe(100);
    });

    it('should handle different grid sizes', () => {
      expect(snapToGrid(15, 10)).toBe(20);
      expect(snapToGrid(14, 10)).toBe(10);
      expect(snapToGrid(123, 25)).toBe(125);
    });

    it('should snap negative values', () => {
      // Note: snapToGrid(-25, 50) returns -0 (JavaScript quirk)
      // -0 and 0 are equal in comparisons but toBe uses Object.is
      expect(Math.abs(snapToGrid(-25, 50))).toBe(0);
      expect(snapToGrid(-40, 50)).toBe(-50);
    });
  });
});
