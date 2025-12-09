'use client';

import React, { useMemo } from 'react';
import {
  applyEasing,
  generateEasingCurvePoints,
  pointsToSVGAreaPath,
  pointsToSVGLinePath,
  EasingType,
} from '@/utils/easing';

/** Color variant for the chart */
export type FadeChartVariant = 'fadeIn' | 'fadeOut';

interface FadeProgressChartProps {
  /** Linear progress value (0-100) from backend */
  progress: number;
  /** Slide-off progress (0-100) - how much the curve has slid off to the left after fade completes */
  slideOffProgress?: number;
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
  /** Color variant: 'fadeIn' (green) or 'fadeOut' (amber) */
  variant?: FadeChartVariant;
}

/**
 * SVG Area Chart showing the eased fade intensity curve.
 * Fills from left to right based on progress, with the curve shape
 * showing the easing function's acceleration/deceleration.
 *
 * After progress reaches 100%, the slideOffProgress can animate the curve
 * sliding off to the left while maintaining 100% fill on the right.
 */
export default function FadeProgressChart({
  progress,
  slideOffProgress = 0,
  easingType = 'EASE_IN_OUT_SINE',
  width = 200,
  height = 60,
  className = '',
  showIntensityLabel = false,
  showPercentLabels = false,
  variant = 'fadeIn',
}: FadeProgressChartProps) {
  // Color classes based on variant
  const colorClasses = variant === 'fadeIn'
    ? {
        fill: 'text-green-500 dark:text-green-400',
        line: 'text-green-600 dark:text-green-400',
        dot: 'text-green-500 dark:text-green-300',
        label: 'text-green-400',
      }
    : {
        fill: 'text-amber-500 dark:text-amber-400',
        line: 'text-amber-600 dark:text-amber-400',
        dot: 'text-amber-500 dark:text-amber-300',
        label: 'text-amber-400',
      };
  // Clamp progress to 0-100 range
  const clampedProgress = Math.max(0, Math.min(100, progress));
  // Convert 0-100 progress to 0-1
  const normalizedProgress = clampedProgress / 100;

  // Clamp slideOffProgress to 0-100 range
  const clampedSlideOff = Math.max(0, Math.min(100, slideOffProgress));
  const normalizedSlideOff = clampedSlideOff / 100;

  // Check if we're in slide-off mode (progress is 100% and sliding)
  const isSliding = clampedProgress >= 100 && clampedSlideOff > 0;
  // Check if slide-off is complete (show solid fill)
  const isComplete = clampedProgress >= 100 && clampedSlideOff >= 100;

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

  // Calculate the slide offset in pixels
  const slideOffsetX = normalizedSlideOff * width;

  // If complete, just show solid fill
  if (isComplete) {
    return (
      <div className={`relative ${className}`} data-testid="fade-progress-chart">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
          aria-label="Fade complete: 100%"
        >
          {/* Solid fill at 100% */}
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="currentColor"
            className={colorClasses.fill}
            opacity={0.6}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} data-testid="fade-progress-chart">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
        aria-label={`Fade progress: ${Math.round(clampedProgress)}%`}
      >
        {/* Sliding group - contains the curve that slides left after 100% */}
        <g transform={isSliding ? `translate(${-slideOffsetX}, 0)` : undefined}>
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
              className={colorClasses.fill}
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
                className={colorClasses.line}
                opacity={0.5}
              />
              {/* Dot at current point on curve */}
              <circle
                cx={progressX}
                cy={progressY}
                r={4}
                fill="currentColor"
                className={colorClasses.dot}
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
              className={colorClasses.dot}
            />
          )}
        </g>

        {/* Fill in the right side with solid 100% as curve slides off */}
        {isSliding && slideOffsetX > 0 && (
          <rect
            x={width - slideOffsetX}
            y={0}
            width={slideOffsetX}
            height={height}
            fill="currentColor"
            className={colorClasses.fill}
            opacity={0.6}
          />
        )}
      </svg>

      {/* Intensity label */}
      {showIntensityLabel && (
        <div className={`absolute -top-1 -right-1 text-xs font-medium ${colorClasses.label} bg-gray-800/80 px-1.5 py-0.5 rounded`}>
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
