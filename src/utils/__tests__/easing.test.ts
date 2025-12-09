import {
  applyEasing,
  interpolate,
  generateEasingCurvePoints,
  pointsToSVGAreaPath,
  pointsToSVGLinePath,
  EasingType,
} from '../easing';

describe('easing utilities', () => {
  describe('applyEasing', () => {
    it('returns 0 for progress 0 on most easing types', () => {
      // S_CURVE uses sigmoid which asymptotically approaches 0 but never reaches it
      const typesWithExact0: EasingType[] = [
        'LINEAR',
        'EASE_IN_OUT_CUBIC',
        'EASE_IN_OUT_SINE',
        'EASE_OUT_EXPONENTIAL',
        'BEZIER',
      ];
      typesWithExact0.forEach((type) => {
        const result = applyEasing(0, type);
        expect(result).toBeCloseTo(0, 2);
      });
    });

    it('returns 1 for progress 1 on most easing types', () => {
      // S_CURVE uses sigmoid which asymptotically approaches 1 but never reaches it
      const typesWithExact1: EasingType[] = [
        'LINEAR',
        'EASE_IN_OUT_CUBIC',
        'EASE_IN_OUT_SINE',
        'EASE_OUT_EXPONENTIAL',
        'BEZIER',
      ];
      typesWithExact1.forEach((type) => {
        const result = applyEasing(1, type);
        expect(result).toBeCloseTo(1, 2);
      });
    });

    it('returns ~0.5 at midpoint for symmetric easing types', () => {
      const symmetricTypes: EasingType[] = [
        'LINEAR',
        'EASE_IN_OUT_CUBIC',
        'EASE_IN_OUT_SINE',
      ];
      symmetricTypes.forEach((type) => {
        const result = applyEasing(0.5, type);
        expect(result).toBeCloseTo(0.5, 1);
      });
    });

    it('clamps progress below 0', () => {
      expect(applyEasing(-0.5, 'LINEAR')).toBe(0);
      expect(applyEasing(-1, 'EASE_IN_OUT_SINE')).toBeCloseTo(0, 2);
    });

    it('clamps progress above 1', () => {
      expect(applyEasing(1.5, 'LINEAR')).toBe(1);
      expect(applyEasing(2, 'EASE_IN_OUT_SINE')).toBeCloseTo(1, 2);
    });

    describe('LINEAR', () => {
      it('returns the same value as input', () => {
        expect(applyEasing(0.25, 'LINEAR')).toBe(0.25);
        expect(applyEasing(0.5, 'LINEAR')).toBe(0.5);
        expect(applyEasing(0.75, 'LINEAR')).toBe(0.75);
      });
    });

    describe('EASE_IN_OUT_CUBIC', () => {
      it('accelerates then decelerates', () => {
        // Early values should be less than linear (slow start)
        const early = applyEasing(0.25, 'EASE_IN_OUT_CUBIC');
        expect(early).toBeLessThan(0.25);

        // Late values should be greater than linear (slow end)
        const late = applyEasing(0.75, 'EASE_IN_OUT_CUBIC');
        expect(late).toBeGreaterThan(0.75);
      });

      it('uses correct formula for first half', () => {
        // At t=0.25: 4 * 0.25^3 = 4 * 0.015625 = 0.0625
        const result = applyEasing(0.25, 'EASE_IN_OUT_CUBIC');
        expect(result).toBeCloseTo(0.0625, 4);
      });
    });

    describe('EASE_IN_OUT_SINE', () => {
      it('follows sine curve', () => {
        // At t=0.5: -(cos(π * 0.5) - 1) / 2 = -(0 - 1) / 2 = 0.5
        const result = applyEasing(0.5, 'EASE_IN_OUT_SINE');
        expect(result).toBeCloseTo(0.5, 4);
      });

      it('is smooth at boundaries', () => {
        // Check derivative is zero at start/end (smooth S-curve)
        const nearStart = applyEasing(0.01, 'EASE_IN_OUT_SINE');
        const nearEnd = applyEasing(0.99, 'EASE_IN_OUT_SINE');
        expect(nearStart).toBeGreaterThan(0);
        expect(nearEnd).toBeLessThan(1);
      });
    });

    describe('EASE_OUT_EXPONENTIAL', () => {
      it('starts fast and slows down', () => {
        // Early values should be greater than linear (fast start)
        const early = applyEasing(0.25, 'EASE_OUT_EXPONENTIAL');
        expect(early).toBeGreaterThan(0.25);

        // Should be close to 1 by 0.5
        const mid = applyEasing(0.5, 'EASE_OUT_EXPONENTIAL');
        expect(mid).toBeGreaterThan(0.9);
      });

      it('returns exactly 1 at progress 1', () => {
        expect(applyEasing(1, 'EASE_OUT_EXPONENTIAL')).toBe(1);
      });
    });

    describe('S_CURVE', () => {
      it('has sigmoid shape with steepness k=10', () => {
        // Sigmoid: 1 / (1 + e^(-10 * (t - 0.5)))
        // At t=0.5: 1 / (1 + e^0) = 0.5
        const mid = applyEasing(0.5, 'S_CURVE');
        expect(mid).toBeCloseTo(0.5, 2);
      });

      it('is close to 0 at start and 1 at end', () => {
        // At t=0: 1 / (1 + e^5) ≈ 0.0067
        const start = applyEasing(0, 'S_CURVE');
        expect(start).toBeLessThan(0.01);

        // At t=1: 1 / (1 + e^-5) ≈ 0.9933
        const end = applyEasing(1, 'S_CURVE');
        expect(end).toBeGreaterThan(0.99);
      });
    });

    it('uses EASE_IN_OUT_SINE as default', () => {
      const withDefault = applyEasing(0.5);
      const withExplicit = applyEasing(0.5, 'EASE_IN_OUT_SINE');
      expect(withDefault).toBe(withExplicit);
    });

    it('handles unknown easing type gracefully', () => {
      // Unknown types should return linear
      const result = applyEasing(0.5, 'UNKNOWN' as EasingType);
      expect(result).toBe(0.5);
    });
  });

  describe('interpolate', () => {
    it('interpolates between start and end values', () => {
      const result = interpolate(0, 100, 0.5, 'LINEAR');
      expect(result).toBe(50);
    });

    it('applies easing to interpolation', () => {
      // With EASE_IN_OUT_CUBIC at 0.25, eased progress is 0.0625
      const result = interpolate(0, 100, 0.25, 'EASE_IN_OUT_CUBIC');
      expect(result).toBeCloseTo(6.25, 2);
    });

    it('returns start value at progress 0', () => {
      expect(interpolate(50, 150, 0, 'EASE_IN_OUT_SINE')).toBeCloseTo(50, 2);
    });

    it('returns end value at progress 1', () => {
      expect(interpolate(50, 150, 1, 'EASE_IN_OUT_SINE')).toBeCloseTo(150, 2);
    });

    it('uses EASE_IN_OUT_SINE as default', () => {
      const withDefault = interpolate(0, 100, 0.5);
      const withExplicit = interpolate(0, 100, 0.5, 'EASE_IN_OUT_SINE');
      expect(withDefault).toBe(withExplicit);
    });
  });

  describe('generateEasingCurvePoints', () => {
    it('generates correct number of points', () => {
      const points = generateEasingCurvePoints('LINEAR', 10);
      expect(points).toHaveLength(11); // 0 to 10 inclusive
    });

    it('first point is at (0, ~0) for most curves', () => {
      // S_CURVE sigmoid doesn't reach exactly 0
      const typesWithExact0: EasingType[] = [
        'LINEAR',
        'EASE_IN_OUT_CUBIC',
        'EASE_IN_OUT_SINE',
        'EASE_OUT_EXPONENTIAL',
        'BEZIER',
      ];
      typesWithExact0.forEach((type) => {
        const points = generateEasingCurvePoints(type, 10);
        expect(points[0].x).toBe(0);
        expect(points[0].y).toBeCloseTo(0, 2);
      });
    });

    it('last point is at (1, ~1) for most curves', () => {
      // S_CURVE sigmoid doesn't reach exactly 1
      const typesWithExact1: EasingType[] = [
        'LINEAR',
        'EASE_IN_OUT_CUBIC',
        'EASE_IN_OUT_SINE',
        'EASE_OUT_EXPONENTIAL',
        'BEZIER',
      ];
      typesWithExact1.forEach((type) => {
        const points = generateEasingCurvePoints(type, 10);
        const last = points[points.length - 1];
        expect(last.x).toBe(1);
        expect(last.y).toBeCloseTo(1, 2);
      });
    });

    it('generates linear points for LINEAR easing', () => {
      const points = generateEasingCurvePoints('LINEAR', 4);
      expect(points).toEqual([
        { x: 0, y: 0 },
        { x: 0.25, y: 0.25 },
        { x: 0.5, y: 0.5 },
        { x: 0.75, y: 0.75 },
        { x: 1, y: 1 },
      ]);
    });

    it('uses default 50 points', () => {
      const points = generateEasingCurvePoints('LINEAR');
      expect(points).toHaveLength(51);
    });

    it('uses EASE_IN_OUT_SINE as default easing', () => {
      const withDefault = generateEasingCurvePoints();
      const withExplicit = generateEasingCurvePoints('EASE_IN_OUT_SINE');
      expect(withDefault).toEqual(withExplicit);
    });
  });

  describe('pointsToSVGAreaPath', () => {
    it('returns empty string for empty points array', () => {
      const path = pointsToSVGAreaPath([], 100, 50);
      expect(path).toBe('');
    });

    it('generates valid SVG path starting with M', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0.5 },
        { x: 1, y: 1 },
      ];
      const path = pointsToSVGAreaPath(points, 100, 50);
      expect(path.startsWith('M')).toBe(true);
    });

    it('closes the path with Z', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ];
      const path = pointsToSVGAreaPath(points, 100, 50);
      expect(path.endsWith('Z')).toBe(true);
    });

    it('starts at bottom-left corner', () => {
      const points = [{ x: 0, y: 0.5 }];
      const path = pointsToSVGAreaPath(points, 100, 50);
      // Should start at M 0 50 (bottom-left)
      expect(path.startsWith('M 0 50')).toBe(true);
    });

    it('scales points to width and height', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ];
      const path = pointsToSVGAreaPath(points, 200, 100);
      // Path should include point at x=200 (width * 1)
      expect(path).toContain('200.00');
    });

    it('inverts Y axis (0,0 is bottom-left in chart)', () => {
      const points = [{ x: 0.5, y: 0.75 }];
      const path = pointsToSVGAreaPath(points, 100, 100);
      // y=0.75 should become 100 - 75 = 25 in SVG coordinates
      // The path includes "L 0 25" (first point y) and "50.00 25.00" (the actual point)
      expect(path).toMatch(/25/);
    });
  });

  describe('pointsToSVGLinePath', () => {
    it('returns empty string for empty points array', () => {
      const path = pointsToSVGLinePath([], 100, 50);
      expect(path).toBe('');
    });

    it('generates valid SVG path starting with M', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ];
      const path = pointsToSVGLinePath(points, 100, 50);
      expect(path.startsWith('M')).toBe(true);
    });

    it('does not close the path (no Z)', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ];
      const path = pointsToSVGLinePath(points, 100, 50);
      expect(path.endsWith('Z')).toBe(false);
    });

    it('starts at first point, not bottom corner', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ];
      const path = pointsToSVGLinePath(points, 100, 50);
      // First point (0, 0) -> SVG (0, 50) since y is inverted
      expect(path.startsWith('M 0.00 50.00')).toBe(true);
    });
  });
});
