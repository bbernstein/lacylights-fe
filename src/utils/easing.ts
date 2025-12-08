/**
 * Easing functions for fade curve visualization
 * Matches backend algorithms in lacylights-go/internal/services/fade/easing.go
 */

/**
 * Supported easing types matching the backend
 */
export type EasingType =
  | 'LINEAR'
  | 'EASE_IN_OUT_CUBIC'
  | 'EASE_IN_OUT_SINE'
  | 'EASE_OUT_EXPONENTIAL'
  | 'BEZIER'
  | 'S_CURVE';

/**
 * Calculates the y value for a cubic bezier curve.
 * Simplified implementation matching the backend.
 */
function cubicBezier(p1y: number, p2y: number, t: number): number {
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  const tSquared = t * t;
  const tCubed = tSquared * t;

  return ay * tCubed + by * tSquared + cy * t;
}

/**
 * Applies an easing function to a progress value (0-1).
 * Matches the backend ApplyEasing function exactly.
 *
 * @param progress - Linear time progress (0-1)
 * @param easingType - The easing function to apply
 * @returns Eased intensity value (0-1)
 */
export function applyEasing(
  progress: number,
  easingType: EasingType = 'EASE_IN_OUT_SINE'
): number {
  // Clamp progress to 0-1
  const t = Math.max(0, Math.min(1, progress));

  switch (easingType) {
    case 'LINEAR':
      return t;

    case 'EASE_IN_OUT_CUBIC':
      if (t < 0.5) {
        return 4 * t * t * t;
      }
      const temp = -2 * t + 2;
      return 1 - (temp * temp * temp) / 2;

    case 'EASE_IN_OUT_SINE':
      return -(Math.cos(Math.PI * t) - 1) / 2;

    case 'EASE_OUT_EXPONENTIAL':
      if (t === 1) {
        return 1;
      }
      return 1 - Math.pow(2, -10 * t);

    case 'BEZIER':
      // Standard ease-in-out bezier curve (0.42, 0, 0.58, 1)
      return cubicBezier(0, 1, t);

    case 'S_CURVE':
      // Sigmoid function normalized to 0-1 range
      const k = 10.0; // Steepness factor
      return 1 / (1 + Math.exp(-k * (t - 0.5)));

    default:
      return t;
  }
}

/**
 * Calculates an interpolated value between start and end.
 * Matches the backend Interpolate function.
 *
 * @param start - Start value
 * @param end - End value
 * @param progress - Linear progress (0-1)
 * @param easingType - The easing function to apply
 * @returns Interpolated value
 */
export function interpolate(
  start: number,
  end: number,
  progress: number,
  easingType: EasingType = 'EASE_IN_OUT_SINE'
): number {
  const easedProgress = applyEasing(progress, easingType);
  return start + (end - start) * easedProgress;
}

/**
 * Generates points for an easing curve path.
 *
 * @param easingType - The easing function
 * @param numPoints - Number of points to generate (default 50)
 * @returns Array of {x, y} points where x and y are 0-1
 */
export function generateEasingCurvePoints(
  easingType: EasingType = 'EASE_IN_OUT_SINE',
  numPoints: number = 50
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = i / numPoints;
    const y = applyEasing(x, easingType);
    points.push({ x, y });
  }

  return points;
}

/**
 * Converts easing curve points to an SVG path string for an area chart.
 * The area fills from the bottom (y=height) up to the curve.
 *
 * @param points - Array of {x, y} points (0-1 range)
 * @param width - SVG width
 * @param height - SVG height
 * @returns SVG path d attribute string
 */
export function pointsToSVGAreaPath(
  points: Array<{ x: number; y: number }>,
  width: number,
  height: number
): string {
  if (points.length === 0) return '';

  // Start at bottom-left
  let path = `M 0 ${height}`;

  // Line up to first point
  path += ` L 0 ${height - points[0].y * height}`;

  // Draw curve through all points
  for (let i = 1; i < points.length; i++) {
    const x = points[i].x * width;
    const y = height - points[i].y * height;
    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  // Close path back to bottom-right and bottom-left
  const lastX = points[points.length - 1].x * width;
  path += ` L ${lastX.toFixed(2)} ${height}`;
  path += ' Z';

  return path;
}

/**
 * Generates an SVG path for just the curve line (no fill).
 *
 * @param points - Array of {x, y} points (0-1 range)
 * @param width - SVG width
 * @param height - SVG height
 * @returns SVG path d attribute string
 */
export function pointsToSVGLinePath(
  points: Array<{ x: number; y: number }>,
  width: number,
  height: number
): string {
  if (points.length === 0) return '';

  const firstX = points[0].x * width;
  const firstY = height - points[0].y * height;
  let path = `M ${firstX.toFixed(2)} ${firstY.toFixed(2)}`;

  for (let i = 1; i < points.length; i++) {
    const x = points[i].x * width;
    const y = height - points[i].y * height;
    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  return path;
}
