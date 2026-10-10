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
  reconcileFixturePositions,
  hasUnsavedPositionChanges,
  applyDragToLayoutState,
  EMPTY_FIXTURE_LAYOUT_STATE,
  type FixturePosition,
  type FixtureLayoutState,
} from '../layoutCanvasUtils';
import type { FixtureInstance } from '../../types';

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
      // Fixture screen size is 160px (80 * 2), so halfSize is 80px
      // Clicks from 920-1080 should hit (1000 ± 80)
      expect(isPointInFixture(1000, 1000, fixtureX, fixtureY, zoomedViewport)).toBe(true);
      expect(isPointInFixture(1070, 1070, fixtureX, fixtureY, zoomedViewport)).toBe(true); // Within 80px of center
      expect(isPointInFixture(1081, 1000, fixtureX, fixtureY, zoomedViewport)).toBe(false); // Just outside (> 80px from center)
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

  describe('hasUnsavedPositionChanges', () => {
    const pos = (fixtureId: string, x: number, y: number, rotation = 0): FixturePosition => ({
      fixtureId,
      x,
      y,
      rotation,
    });

    it('is false when every position matches its saved position', () => {
      expect(
        hasUnsavedPositionChanges(new Map([['a', pos('a', 1, 2)]]), new Map([['a', pos('a', 1, 2)]])),
      ).toBe(false);
    });

    it('is true when a position has no saved position', () => {
      expect(hasUnsavedPositionChanges(new Map([['a', pos('a', 1, 2)]]), new Map())).toBe(true);
    });

    it('is true when x, y or rotation differs', () => {
      const saved = new Map([['a', pos('a', 1, 2)]]);
      expect(hasUnsavedPositionChanges(new Map([['a', pos('a', 9, 2)]]), saved)).toBe(true);
      expect(hasUnsavedPositionChanges(new Map([['a', pos('a', 1, 9)]]), saved)).toBe(true);
      expect(hasUnsavedPositionChanges(new Map([['a', pos('a', 1, 2, 45)]]), saved)).toBe(true);
    });
  });

  describe('reconcileFixturePositions', () => {
    const fixture = (id: string, layoutX?: number, layoutY?: number): FixtureInstance =>
      ({ id, name: id, layoutX, layoutY, layoutRotation: 0 }) as FixtureInstance;
    const pos = (fixtureId: string, x: number, y: number): FixturePosition => ({
      fixtureId,
      x,
      y,
      rotation: 0,
    });
    const state = (overrides: Partial<FixtureLayoutState> = {}): FixtureLayoutState => ({
      positions: new Map(),
      initializedIds: new Set(),
      savedPositions: new Map(),
      hasUnsavedChanges: false,
      ...overrides,
    });
    const reconcile = (prev: FixtureLayoutState, fixtures: FixtureInstance[]) =>
      reconcileFixturePositions(prev, fixtures, 2000, 2000);

    it('initializes fixtures from their saved layout and records them as saved', () => {
      const next = reconcile(EMPTY_FIXTURE_LAYOUT_STATE, [fixture('a', 500, 400)]);

      expect(next.positions.get('a')).toEqual(pos('a', 500, 400));
      expect(next.savedPositions.get('a')).toEqual(pos('a', 500, 400));
      expect(next.initializedIds.has('a')).toBe(true);
      expect(next.hasUnsavedChanges).toBe(false);
    });

    it('auto-lays out fixtures without a saved layout and does not mark them saved', () => {
      const next = reconcile(EMPTY_FIXTURE_LAYOUT_STATE, [fixture('a')]);

      expect(next.positions.has('a')).toBe(true);
      expect(next.savedPositions.has('a')).toBe(false);
      expect(next.initializedIds.has('a')).toBe(true);
      // Initial auto-layout intentionally doesn't flag unsaved changes
      expect(next.hasUnsavedChanges).toBe(false);
    });

    it('never mutates the previous state', () => {
      const prev = state({
        positions: new Map([['a', pos('a', 500, 500)]]),
        initializedIds: new Set(['a', 'gone']),
        savedPositions: new Map([
          ['a', pos('a', 500, 500)],
          ['gone', pos('gone', 1, 1)],
        ]),
      });
      const snapshot = () =>
        JSON.stringify({
          positions: [...prev.positions],
          ids: [...prev.initializedIds],
          saved: [...prev.savedPositions],
          unsaved: prev.hasUnsavedChanges,
        });
      const before = snapshot();

      reconcile(prev, [fixture('a', 700, 500), fixture('b')]);

      expect(snapshot()).toBe(before);
      expect(EMPTY_FIXTURE_LAYOUT_STATE.positions.size).toBe(0);
    });

    it('returns the same result when replayed with the same inputs (database update)', () => {
      // Existing fixture whose database position changed (undo/redo)
      const prev = state({
        positions: new Map([['a', pos('a', 500, 500)]]),
        initializedIds: new Set(['a']),
        savedPositions: new Map([['a', pos('a', 500, 500)]]),
      });
      const fixtures = [fixture('a', 700, 500)];

      const first = reconcile(prev, fixtures);
      const replay = reconcile(prev, fixtures);

      expect(first.positions.get('a')).toEqual(pos('a', 700, 500));
      expect(first.savedPositions.get('a')).toEqual(pos('a', 700, 500));
      expect(first.hasUnsavedChanges).toBe(false);
      expect(replay).toEqual(first);
    });

    it('preserves unsaved local edits when the database position changes', () => {
      const prev = state({
        positions: new Map([['a', pos('a', 600, 600)]]), // Dragged, not saved
        initializedIds: new Set(['a']),
        savedPositions: new Map([['a', pos('a', 500, 500)]]),
        hasUnsavedChanges: true,
      });

      const next = reconcile(prev, [fixture('a', 700, 500)]);

      expect(next.positions.get('a')).toEqual(pos('a', 600, 600));
      expect(next.savedPositions.get('a')).toEqual(pos('a', 500, 500));
      expect(next.hasUnsavedChanges).toBe(true);
    });

    it('clears stale unsaved state when the database now matches the local position', () => {
      const prev = state({
        positions: new Map([['a', pos('a', 700, 500)]]),
        initializedIds: new Set(['a']),
        savedPositions: new Map([['a', pos('a', 500, 500)]]),
        hasUnsavedChanges: true,
      });

      const next = reconcile(prev, [fixture('a', 700, 500)]);

      expect(next.positions.get('a')).toEqual(pos('a', 700, 500));
      expect(next.savedPositions.get('a')).toEqual(pos('a', 700, 500));
      expect(next.hasUnsavedChanges).toBe(false);
    });

    it('keeps the previous unsaved flag when no database update occurred', () => {
      const prev = state({
        positions: new Map([['a', pos('a', 600, 600)]]),
        initializedIds: new Set(['a']),
        savedPositions: new Map([['a', pos('a', 500, 500)]]),
        hasUnsavedChanges: true,
      });

      expect(reconcile(prev, [fixture('a', 500, 500)]).hasUnsavedChanges).toBe(true);
    });

    it('drops removed fixtures from positions and bookkeeping', () => {
      const prev = state({
        positions: new Map([
          ['a', pos('a', 500, 500)],
          ['gone', pos('gone', 900, 900)],
        ]),
        initializedIds: new Set(['a', 'gone']),
        savedPositions: new Map([
          ['a', pos('a', 500, 500)],
          ['gone', pos('gone', 900, 900)],
        ]),
      });

      const next = reconcile(prev, [fixture('a', 500, 500)]);

      expect([...next.positions.keys()]).toEqual(['a']);
      expect(next.initializedIds.has('gone')).toBe(false);
      expect(next.savedPositions.has('gone')).toBe(false);
    });

    it('returns the previous state object when nothing changed', () => {
      const first = reconcile(EMPTY_FIXTURE_LAYOUT_STATE, [fixture('a', 500, 500), fixture('b')]);

      expect(reconcile(first, [fixture('a', 500, 500), fixture('b')])).toBe(first);
    });

    it('re-initializes a fixture marked initialized but missing from positions', () => {
      const prev = state({
        initializedIds: new Set(['a']),
        savedPositions: new Map([['a', pos('a', 500, 500)]]),
      });

      expect(reconcile(prev, [fixture('a', 500, 500)]).positions.get('a')).toEqual(pos('a', 500, 500));
    });
  });

  describe('applyDragToLayoutState', () => {
    const pos = (fixtureId: string, x: number, y: number): FixturePosition => ({
      fixtureId,
      x,
      y,
      rotation: 15,
    });
    const prev: FixtureLayoutState = {
      positions: new Map([
        ['a', pos('a', 400, 400)],
        ['b', pos('b', 800, 400)],
        ['c', pos('c', 1200, 400)],
      ]),
      initializedIds: new Set(['a', 'b', 'c']),
      savedPositions: new Map(),
      hasUnsavedChanges: false,
    };
    const drag = (overrides: Partial<Parameters<typeof applyDragToLayoutState>[1]> = {}) => ({
      draggedFixtureIds: ['a', 'b'],
      dragOffsets: new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 400, y: 0 }],
      ]),
      pointer: { x: 500, y: 300 },
      viewport: { x: 0, y: 0, scale: 1 },
      canvasWidth: 2000,
      canvasHeight: 2000,
      gridSize: 8,
      ...overrides,
    });

    it('moves dragged fixtures by their grab offsets, snapped to the grid', () => {
      const next = applyDragToLayoutState(prev, drag());

      expect(next.positions.get('a')).toEqual({ ...pos('a', 504, 304) });
      expect(next.positions.get('b')).toEqual({ ...pos('b', 904, 304) });
      // Undragged fixtures and rotation are untouched
      expect(next.positions.get('c')).toBe(prev.positions.get('c'));
      expect(next.hasUnsavedChanges).toBe(true);
    });

    it('accounts for the viewport transform', () => {
      const next = applyDragToLayoutState(
        prev,
        drag({ draggedFixtureIds: ['a'], viewport: { x: 100, y: 100, scale: 2 } }),
      );

      // (500 - 100) / 2 = 200, (300 - 100) / 2 = 100
      expect(next.positions.get('a')).toMatchObject({ x: 200, y: 104 });
    });

    it('clamps to the canvas bounds', () => {
      const next = applyDragToLayoutState(prev, drag({ draggedFixtureIds: ['a'], pointer: { x: -500, y: 5000 } }));

      expect(next.positions.get('a')).toMatchObject({
        x: FIXTURE_SIZE / 2,
        y: 2000 - FIXTURE_SIZE / 2,
      });
    });

    it('skips fixtures without an offset or position, and never mutates prev', () => {
      const before = JSON.stringify([...prev.positions]);
      const next = applyDragToLayoutState(prev, drag({ draggedFixtureIds: ['c', 'missing'] }));

      expect(next.positions.get('c')).toBe(prev.positions.get('c')); // No offset for c
      expect(next.positions.has('missing')).toBe(false);
      expect(JSON.stringify([...prev.positions])).toBe(before);
    });
  });
});
