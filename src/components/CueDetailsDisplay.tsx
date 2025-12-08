'use client';

import React from 'react';
import { Cue } from '@/types';
import FadeProgressChart from './FadeProgressChart';
import { EasingType } from '@/utils/easing';

interface CueDetailsDisplayProps {
  /** The cue to display */
  cue: Cue;
  /** Current fade progress (0-100) */
  fadeProgress?: number;
  /** Whether the cue is currently playing */
  isPlaying?: boolean;
  /** Whether to show the fade progress chart */
  showChart?: boolean;
  /** Compact layout for inline display */
  compact?: boolean;
  /** Override easing type (if not in cue) */
  easingType?: EasingType;
}

/**
 * Displays detailed cue information including timing and optional fade visualization.
 * Used in both CueListPlayer and CueListUnifiedView for consistent cue details display.
 */
export default function CueDetailsDisplay({
  cue,
  fadeProgress = 0,
  isPlaying = false,
  showChart = true,
  compact = false,
  easingType,
}: CueDetailsDisplayProps) {
  // Get easing type from cue (if available) or use provided/default
  const effectiveEasingType: EasingType =
    easingType ||
    ((cue as Cue & { easingType?: string }).easingType as EasingType) ||
    'EASE_IN_OUT_SINE';

  /**
   * Formats a time value in seconds to a human-readable string.
   * Shows milliseconds for values < 1s, otherwise shows seconds with one decimal.
   */
  const formatTime = (seconds: number): string => {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    }
    if (seconds === Math.floor(seconds)) {
      return `${seconds}s`;
    }
    return `${seconds.toFixed(1)}s`;
  };

  // Compact layout for list items
  if (compact) {
    return (
      <div
        className="flex items-center justify-between gap-4"
        data-testid="cue-details-compact"
      >
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-white truncate">
            {cue.name}
          </div>
          <div className="text-sm text-gray-400 truncate">
            Scene: {cue.scene.name}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-300 shrink-0">
          <div className="flex items-center gap-1" title="Fade In Time">
            <span className="text-gray-500">In:</span>
            <span className="font-medium">{formatTime(cue.fadeInTime)}</span>
          </div>
          <div className="flex items-center gap-1" title="Fade Out Time">
            <span className="text-gray-500">Out:</span>
            <span className="font-medium">{formatTime(cue.fadeOutTime)}</span>
          </div>
          {cue.followTime !== undefined && cue.followTime > 0 && (
            <div
              className="flex items-center gap-1 text-blue-400"
              title="Auto-Follow Time"
            >
              <span className="text-blue-500">Follow:</span>
              <span className="font-medium">{formatTime(cue.followTime)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full layout with chart
  return (
    <div className="space-y-4" data-testid="cue-details-full">
      {/* Cue Name and Scene */}
      <div>
        <div className="text-2xl font-bold text-white">{cue.name}</div>
        <div className="text-sm text-gray-400 mt-1">
          Scene: {cue.scene.name}
        </div>
      </div>

      {/* Timing Details */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-gray-700/50 px-4 py-2 rounded-lg">
          <div className="text-gray-400 text-xs uppercase tracking-wide">
            Fade In
          </div>
          <div className="text-white text-lg font-semibold">
            {formatTime(cue.fadeInTime)}
          </div>
        </div>

        <div className="bg-gray-700/50 px-4 py-2 rounded-lg">
          <div className="text-gray-400 text-xs uppercase tracking-wide">
            Fade Out
          </div>
          <div className="text-white text-lg font-semibold">
            {formatTime(cue.fadeOutTime)}
          </div>
        </div>

        {cue.followTime !== undefined && cue.followTime > 0 && (
          <div className="bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-700/50">
            <div className="text-blue-400 text-xs uppercase tracking-wide">
              Auto-Follow
            </div>
            <div className="text-white text-lg font-semibold">
              {formatTime(cue.followTime)}
            </div>
          </div>
        )}
      </div>

      {/* Fade Progress Chart */}
      {showChart && isPlaying && fadeProgress > 0 && fadeProgress < 100 && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
            Fade Progress
          </div>
          <FadeProgressChart
            progress={fadeProgress}
            easingType={effectiveEasingType}
            width={280}
            height={60}
            showIntensityLabel
            showPercentLabels
          />
        </div>
      )}

      {/* Notes (if present) */}
      {cue.notes && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Notes
          </div>
          <div className="text-sm text-gray-300 italic">{cue.notes}</div>
        </div>
      )}
    </div>
  );
}
