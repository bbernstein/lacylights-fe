'use client';

import React, { memo, useMemo } from 'react';
import { useCueListPlayback } from '@/hooks/useCueListPlayback';

interface CueListPlaybackStatusProps {
  cueListId: string;
  cueCount: number;
}

const CueListPlaybackStatus = memo(function CueListPlaybackStatus({ cueListId, cueCount }: CueListPlaybackStatusProps) {
  const { playbackStatus } = useCueListPlayback(cueListId);

  const statusData = useMemo(() => {
    // Show status for both playing and paused states
    if (!playbackStatus || (!playbackStatus.isPlaying && !playbackStatus.isPaused)) {
      return null;
    }

    const currentCueIndex = playbackStatus.currentCueIndex ?? -1;
    const currentCueNumber = currentCueIndex >= 0 ? currentCueIndex + 1 : 0;
    const fadeProgress = Math.round(playbackStatus.fadeProgress ?? 0);

    return {
      currentCueNumber,
      fadeProgress,
      showProgress: fadeProgress > 0 && fadeProgress < 100,
      isPaused: playbackStatus.isPaused
    };
  }, [playbackStatus]);

  if (!statusData) {
    return null;
  }

  // Paused state - amber styling
  if (statusData.isPaused) {
    return (
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          <span className="mr-1">⏸</span>
          Paused
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Cue {statusData.currentCueNumber}/{cueCount}
        </span>
      </div>
    );
  }

  // Playing state - green styling
  return (
    <div className="flex items-center space-x-2">
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <span className="animate-pulse mr-1">●</span>
        Playing
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Cue {statusData.currentCueNumber}/{cueCount}
      </span>
      {statusData.showProgress && (
        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div
            className="bg-green-600 h-1 rounded-full transition-all ease-linear"
            style={{
              width: `${statusData.fadeProgress}%`,
              transitionDuration: '150ms'
            }}
          />
        </div>
      )}
    </div>
  );
});

export default CueListPlaybackStatus;