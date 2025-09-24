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
    if (!playbackStatus || !playbackStatus.isPlaying) {
      return null;
    }

    const currentCueIndex = playbackStatus.currentCueIndex ?? -1;
    const currentCueNumber = currentCueIndex >= 0 ? currentCueIndex + 1 : 0;
    const fadeProgress = Math.round(playbackStatus.fadeProgress ?? 0);

    return {
      currentCueNumber,
      fadeProgress,
      showProgress: fadeProgress > 0 && fadeProgress < 100
    };
  }, [playbackStatus]);

  if (!statusData) {
    return null;
  }

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