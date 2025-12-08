'use client';

import React, { useMemo } from 'react';
import {
  applyEasing,
  generateEasingCurvePoints,
  pointsToSVGAreaPath,
  pointsToSVGLinePath,
  EasingType,
} from '@/utils/easing';

interface FadeProgressChartProps {
  /** Linear progress value (0-100) from backend */
  progress: number;
  /** Easing type for the curve shape */
  easingType?: EasingType;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** CSS class for the container */
  className?: string;
  /** Show the current intensity value as text */
  showIntensityLabel?: boolean;
  /** Show percentage labels on the chart */
  showPercentLabels?: boolean;
}

/**
 * SVG Area Chart showing the eased fade intensity curve.
 * Fills from left to right based on progress, with the curve shape
 * showing the easing function's acceleration/deceleration.
 */
export default function FadeProgressChart({
  progress,
  easingType = 'EASE_IN_OUT_SINE',
  width = 200,
  height = 60,
  className = '',
  showIntensityLabel = false,
  showPercentLabels = false,
}: FadeProgressChartProps) {
  // Clamp progress to 0-100 range
  const clampedProgress = Math.max(0, Math.min(100, progress));
  // Convert 0-100 progress to 0-1
  const normalizedProgress = clampedProgress / 100;

  // Generate the full curve points (memoized since easingType rarely changes)
  const fullCurvePoints = useMemo(
    () => generateEasingCurvePoints(easingType, 50),
    [easingType]
  );

  // Full curve line path (outline)
  const fullCurveLinePath = useMemo(
    () => pointsToSVGLinePath(fullCurvePoints, width, height),
    [fullCurvePoints, width, height]
  );

  // Generate the filled portion path based on current progress
  const filledPath = useMemo(() => {
    if (normalizedProgress <= 0) return '';

    // Filter points up to current progress
    const filledPoints = fullCurvePoints.filter(
      (p) => p.x <= normalizedProgress
    );

    // Add the current progress point with interpolated y value
    if (filledPoints.length > 0 && normalizedProgress < 1) {
      const currentY = applyEasing(normalizedProgress, easingType);
      filledPoints.push({ x: normalizedProgress, y: currentY });
    }

    return pointsToSVGAreaPath(filledPoints, width, height);
  }, [normalizedProgress, easingType, fullCurvePoints, width, height]);

  // Calculate current intensity for label
  const currentIntensity = useMemo(() => {
    return Math.round(applyEasing(normalizedProgress, easingType) * 100);
  }, [normalizedProgress, easingType]);

  // Current progress position for the indicator line
  const progressX = normalizedProgress * width;
  const progressY = height - applyEasing(normalizedProgress, easingType) * height;

  return (
    <div className={`relative ${className}`} data-testid="fade-progress-chart">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        aria-label={`Fade progress: ${Math.round(clampedProgress)}%`}
      >
        {/* Grid lines for reference (subtle) */}
        {showPercentLabels && (
          <>
            <line
              x1={0}
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-gray-700"
              strokeDasharray="2,2"
            />
            <line
              x1={width / 2}
              y1={0}
              x2={width / 2}
              y2={height}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-gray-700"
              strokeDasharray="2,2"
            />
          </>
        )}

        {/* Background curve outline (unfilled portion) */}
        <path
          d={fullCurveLinePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-gray-600 dark:text-gray-500"
          opacity={0.4}
        />

        {/* Filled area showing progress */}
        {filledPath && (
          <path
            d={filledPath}
            fill="currentColor"
            className="text-green-500 dark:text-green-400"
            opacity={0.6}
          />
        )}

        {/* Progress indicator line (vertical) */}
        {normalizedProgress > 0 && normalizedProgress < 1 && (
          <>
            {/* Vertical line at current progress */}
            <line
              x1={progressX}
              y1={0}
              x2={progressX}
              y2={height}
              stroke="currentColor"
              strokeWidth={1}
              className="text-green-600 dark:text-green-400"
              opacity={0.5}
            />
            {/* Dot at current point on curve */}
            <circle
              cx={progressX}
              cy={progressY}
              r={4}
              fill="currentColor"
              className="text-green-500 dark:text-green-300"
            />
          </>
        )}

        {/* Completed state indicator */}
        {normalizedProgress >= 1 && (
          <circle
            cx={width}
            cy={0}
            r={4}
            fill="currentColor"
            className="text-green-500 dark:text-green-300"
          />
        )}
      </svg>

      {/* Intensity label */}
      {showIntensityLabel && (
        <div className="absolute -top-1 -right-1 text-xs font-medium text-green-400 bg-gray-800/80 px-1.5 py-0.5 rounded">
          {currentIntensity}%
        </div>
      )}

      {/* Percent labels */}
      {showPercentLabels && (
        <>
          <div className="absolute -bottom-4 left-0 text-[10px] text-gray-500">
            0%
          </div>
          <div className="absolute -bottom-4 right-0 text-[10px] text-gray-500">
            100%
          </div>
        </>
      )}
    </div>
  );
}
