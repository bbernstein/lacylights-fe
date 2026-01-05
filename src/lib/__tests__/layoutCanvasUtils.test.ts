import {
  FIXTURE_SIZE,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  ViewportTransform,
  screenToPixel,
  pixelToScreen,
  isNormalizedCoordinate,
  normalizedToPixels,
  clampToCanvas,
  getFixtureBounds,
  isPointInFixture,
  calculateAutoLayoutPositions,
  snapToGrid,
} from '../layoutCanvasUtils';

describe('layoutCanvasUtils', () => {
  describe('constants', () => {
    it('exports correct fixture size', () => {
      expect(FIXTURE_SIZE).toBe(80);
    });

    it('exports correct default canvas dimensions', () => {
      expect(DEFAULT_CANVAS_WIDTH).toBe(2000);
      expect(DEFAULT_CANVAS_HEIGHT).toBe(2000);
    });
  });

  describe('screenToPixel', () => {
    it('converts screen coordinates to pixel coordinates at 1x zoom', () => {
      const viewport: ViewportTransform = { x: 0, y: 0, scale: 1 };
      const result = screenToPixel(100, 200, viewport);
      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('converts screen coordinates with pan offset', () => {
      const viewport: ViewportTransform = { x: 50, y: 100, scale: 1 };
      const result = screenToPixel(150, 300, viewport);
      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('converts screen coordinates with zoom', () => {
      const viewport: ViewportTransform = { x: 0, y: 0, scale: 2 };
      const result = screenToPixel(200, 400, viewport);
      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('converts screen coordinates with pan and zoom', () => {
      const viewport: ViewportTransform = { x: 100, y: 100, scale: 2 };
      const result = screenToPixel(300, 500, viewport);
      expect(result).toEqual({ x: 100, y: 200 });
    });
  });

  describe('pixelToScreen', () => {
    it('converts pixel coordinates to screen coordinates at 1x zoom', () => {
      const viewport: ViewportTransform = { x: 0, y: 0, scale: 1 };
      const result = pixelToScreen(100, 200, viewport);
      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('converts pixel coordinates with pan offset', () => {
      const viewport: ViewportTransform = { x: 50, y: 100, scale: 1 };
      const result = pixelToScreen(100, 200, viewport);
      expect(result).toEqual({ x: 150, y: 300 });
    });

    it('converts pixel coordinates with zoom', () => {
      const viewport: ViewportTransform = { x: 0, y: 0, scale: 2 };
      const result = pixelToScreen(100, 200, viewport);
      expect(result).toEqual({ x: 200, y: 400 });
    });

    it('converts pixel coordinates with pan and zoom', () => {
      const viewport: ViewportTransform = { x: 100, y: 100, scale: 2 };
      const result = pixelToScreen(100, 200, viewport);
      expect(result).toEqual({ x: 300, y: 500 });
    });

    it('is inverse of screenToPixel', () => {
      const viewport: ViewportTransform = { x: 50, y: 75, scale: 1.5 };
      const pixelX = 300;
      const pixelY = 400;
      const screen = pixelToScreen(pixelX, pixelY, viewport);
      const backToPixel = screenToPixel(screen.x, screen.y, viewport);
      expect(backToPixel.x).toBeCloseTo(pixelX);
      expect(backToPixel.y).toBeCloseTo(pixelY);
    });
  });

  describe('isNormalizedCoordinate', () => {
    it('returns true for values strictly between 0 and 1', () => {
      expect(isNormalizedCoordinate(0.5)).toBe(true);
      expect(isNormalizedCoordinate(0.01)).toBe(true);
      expect(isNormalizedCoordinate(0.99)).toBe(true);
    });

    it('returns false for 0 and 1 exactly', () => {
      expect(isNormalizedCoordinate(0)).toBe(false);
      expect(isNormalizedCoordinate(1)).toBe(false);
    });

    it('returns false for values outside 0-1', () => {
      expect(isNormalizedCoordinate(-0.5)).toBe(false);
      expect(isNormalizedCoordinate(1.5)).toBe(false);
      expect(isNormalizedCoordinate(100)).toBe(false);
    });
  });

  describe('normalizedToPixels', () => {
    it('converts normalized coordinates to pixels with default canvas size', () => {
      const result = normalizedToPixels(0.5, 0.5);
      expect(result).toEqual({ x: 1000, y: 1000 });
    });

    it('converts normalized coordinates to pixels with custom canvas size', () => {
      const result = normalizedToPixels(0.5, 0.5, 1000, 800);
      expect(result).toEqual({ x: 500, y: 400 });
    });

    it('handles edge values', () => {
      expect(normalizedToPixels(0, 0)).toEqual({ x: 0, y: 0 });
      expect(normalizedToPixels(1, 1)).toEqual({ x: 2000, y: 2000 });
    });
  });

  describe('clampToCanvas', () => {
    it('does not clamp positions well within bounds', () => {
      const result = clampToCanvas(500, 500);
      expect(result).toEqual({ x: 500, y: 500 });
    });

    it('clamps positions at left edge', () => {
      const result = clampToCanvas(0, 500);
      expect(result.x).toBe(FIXTURE_SIZE / 2);
      expect(result.y).toBe(500);
    });

    it('clamps positions at right edge', () => {
      const result = clampToCanvas(2000, 500);
      expect(result.x).toBe(DEFAULT_CANVAS_WIDTH - FIXTURE_SIZE / 2);
      expect(result.y).toBe(500);
    });

    it('clamps positions at top edge', () => {
      const result = clampToCanvas(500, 0);
      expect(result.x).toBe(500);
      expect(result.y).toBe(FIXTURE_SIZE / 2);
    });

    it('clamps positions at bottom edge', () => {
      const result = clampToCanvas(500, 2000);
      expect(result.x).toBe(500);
      expect(result.y).toBe(DEFAULT_CANVAS_HEIGHT - FIXTURE_SIZE / 2);
    });

    it('clamps with custom canvas dimensions', () => {
      const result = clampToCanvas(0, 0, 1000, 800);
      expect(result).toEqual({ x: FIXTURE_SIZE / 2, y: FIXTURE_SIZE / 2 });
    });
  });

  describe('getFixtureBounds', () => {
    it('calculates bounds for fixture at center', () => {
      const bounds = getFixtureBounds(1000, 1000);
      const half = FIXTURE_SIZE / 2;
      expect(bounds).toEqual({
        left: 1000 - half,
        top: 1000 - half,
        right: 1000 + half,
        bottom: 1000 + half,
      });
    });

    it('calculates bounds for fixture at origin', () => {
      const bounds = getFixtureBounds(0, 0);
      const half = FIXTURE_SIZE / 2;
      expect(bounds).toEqual({
        left: -half,
        top: -half,
        right: half,
        bottom: half,
      });
    });
  });

  describe('isPointInFixture', () => {
    const viewport: ViewportTransform = { x: 0, y: 0, scale: 1 };
    const fixtureX = 500;
    const fixtureY = 500;

    it('returns true for point at fixture center', () => {
      expect(isPointInFixture(500, 500, fixtureX, fixtureY, viewport)).toBe(true);
    });

    it('returns true for point within fixture bounds', () => {
      expect(isPointInFixture(510, 510, fixtureX, fixtureY, viewport)).toBe(true);
      expect(isPointInFixture(490, 490, fixtureX, fixtureY, viewport)).toBe(true);
    });

    it('returns true for point at fixture edge', () => {
      const half = FIXTURE_SIZE / 2;
      expect(isPointInFixture(500 + half, 500, fixtureX, fixtureY, viewport)).toBe(true);
      expect(isPointInFixture(500 - half, 500, fixtureX, fixtureY, viewport)).toBe(true);
    });

    it('returns false for point outside fixture', () => {
      const half = FIXTURE_SIZE / 2;
      expect(isPointInFixture(500 + half + 1, 500, fixtureX, fixtureY, viewport)).toBe(false);
      expect(isPointInFixture(500, 500 - half - 1, fixtureX, fixtureY, viewport)).toBe(false);
    });

    it('handles zoomed viewport correctly', () => {
      const zoomedViewport: ViewportTransform = { x: 0, y: 0, scale: 2 };
      // At 2x zoom, fixture at 500,500 pixel coords appears at 1000,1000 screen coords
      // Fixture screen size is still 80px (fixed), so clicks 500-540 on screen should hit
      // But the fixture position on screen is 1000, so clicks 960-1040 should hit
      expect(isPointInFixture(1000, 1000, fixtureX, fixtureY, zoomedViewport)).toBe(true);
      expect(isPointInFixture(1030, 1030, fixtureX, fixtureY, zoomedViewport)).toBe(true);
      expect(isPointInFixture(500, 500, fixtureX, fixtureY, zoomedViewport)).toBe(false); // Too far from 1000,1000
    });
  });

  describe('calculateAutoLayoutPositions', () => {
    it('returns empty array for zero fixtures', () => {
      const positions = calculateAutoLayoutPositions(0);
      expect(positions).toEqual([]);
    });

    it('positions single fixture at center', () => {
      const positions = calculateAutoLayoutPositions(1);
      expect(positions).toHaveLength(1);
      expect(positions[0]).toEqual({ x: 1000, y: 1000 });
    });

    it('positions two fixtures in a row', () => {
      const positions = calculateAutoLayoutPositions(2);
      expect(positions).toHaveLength(2);
      // 2 fixtures: 2 cols x 1 row
      expect(positions[0]).toEqual({ x: 500, y: 1000 });
      expect(positions[1]).toEqual({ x: 1500, y: 1000 });
    });

    it('positions four fixtures in a 2x2 grid', () => {
      const positions = calculateAutoLayoutPositions(4);
      expect(positions).toHaveLength(4);
      // 4 fixtures: 2 cols x 2 rows
      expect(positions[0]).toEqual({ x: 500, y: 500 });
      expect(positions[1]).toEqual({ x: 1500, y: 500 });
      expect(positions[2]).toEqual({ x: 500, y: 1500 });
      expect(positions[3]).toEqual({ x: 1500, y: 1500 });
    });

    it('uses custom canvas dimensions', () => {
      const positions = calculateAutoLayoutPositions(1, 1000, 800);
      expect(positions[0]).toEqual({ x: 500, y: 400 });
    });
  });

  describe('snapToGrid', () => {
    it('snaps to nearest grid point', () => {
      const result = snapToGrid(123, 456, 50);
      expect(result).toEqual({ x: 100, y: 450 });
    });

    it('rounds to nearest grid intersection', () => {
      expect(snapToGrid(75, 75, 50)).toEqual({ x: 100, y: 100 });
      expect(snapToGrid(74, 74, 50)).toEqual({ x: 50, y: 50 });
    });

    it('handles position exactly on grid', () => {
      expect(snapToGrid(100, 200, 50)).toEqual({ x: 100, y: 200 });
    });

    it('handles different grid sizes', () => {
      expect(snapToGrid(35, 67, 25)).toEqual({ x: 25, y: 75 });
    });
  });
});
