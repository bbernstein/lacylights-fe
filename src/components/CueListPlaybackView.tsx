'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CUE_LIST, PLAY_CUE, FADE_TO_BLACK } from '@/graphql/cueLists';
import { Cue } from '@/types';

interface CueListPlaybackViewProps {
  cueListId: string;
  onClose: () => void;
}

interface CueRowProps {
  cue: Cue;
  index: number;
  isActive: boolean;
  isNext: boolean;
  isPrevious: boolean;
  fadeProgress?: number;
}

function CueRow({ cue, index: _index, isActive, isNext, isPrevious, fadeProgress }: CueRowProps) {
  // Set row background colors with better contrast
  let rowBgClass = '';
  if (isActive) {
    rowBgClass = 'bg-green-50 dark:bg-green-900/40';
  } else if (isNext) {
    rowBgClass = 'bg-blue-50 dark:bg-blue-900/30';
  } else if (isPrevious) {
    rowBgClass = 'bg-gray-50 dark:bg-gray-800/50';
  } else {
    rowBgClass = 'bg-white dark:bg-gray-800';
  }

  return (
    <tr className={`${rowBgClass} transition-colors duration-300 border-b border-gray-200 dark:border-gray-700`}>
      <td className={`px-4 py-3 text-sm font-medium ${
        isActive ? 'text-gray-900 dark:text-white' : 
        isNext ? 'text-gray-900 dark:text-white' : 
        'text-gray-800 dark:text-gray-100'
      }`}>
        {cue.cueNumber}
      </td>
      <td className={`px-4 py-3 text-sm font-medium ${
        isActive ? 'text-gray-900 dark:text-white' : 
        isNext ? 'text-gray-900 dark:text-white' : 
        'text-gray-800 dark:text-gray-100'
      }`}>
        {cue.name}
      </td>
      <td className={`px-4 py-3 text-sm ${
        isActive ? 'text-gray-800 dark:text-gray-100' : 
        isNext ? 'text-gray-800 dark:text-gray-100' : 
        'text-gray-700 dark:text-gray-200'
      }`}>
        {cue.scene.name}
      </td>
      <td className={`px-4 py-3 text-sm ${
        isActive ? 'text-gray-800 dark:text-gray-100' : 
        isNext ? 'text-gray-800 dark:text-gray-100' : 
        'text-gray-700 dark:text-gray-200'
      }`}>
        {cue.fadeInTime}s
      </td>
      <td className={`px-4 py-3 text-sm ${
        isActive ? 'text-gray-800 dark:text-gray-100' : 
        isNext ? 'text-gray-800 dark:text-gray-100' : 
        'text-gray-700 dark:text-gray-200'
      }`}>
        {cue.fadeOutTime}s
      </td>
      <td className={`px-4 py-3 text-sm ${
        isActive ? 'text-gray-800 dark:text-gray-100' : 
        isNext ? 'text-gray-800 dark:text-gray-100' : 
        'text-gray-700 dark:text-gray-200'
      }`}>
        {cue.followTime || '-'}
      </td>
      <td className="px-4 py-3">
        {isActive && (
          <div className="flex items-center space-x-2">
            <span className="text-green-600 dark:text-green-400 font-medium">LIVE</span>
            {fadeProgress !== undefined && fadeProgress < 100 && (
              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${fadeProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
        {isNext && (
          <span className="text-blue-600 dark:text-blue-400 font-medium">NEXT</span>
        )}
      </td>
    </tr>
  );
}

export default function CueListPlaybackView({ cueListId, onClose }: CueListPlaybackViewProps) {
  const [currentCueIndex, setCurrentCueIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fadeProgress, setFadeProgress] = useState(0);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: cueListData, loading } = useQuery(GET_CUE_LIST, {
    variables: { id: cueListId },
  });

  const [playCue] = useMutation(PLAY_CUE, {
    onError: (error) => {
      console.error('Error playing cue:', error);
    },
  });

  const [fadeToBlack] = useMutation(FADE_TO_BLACK, {
    onError: (error) => {
      console.error('Error fading to black:', error);
    },
  });

  const cueList = cueListData?.cueList;
  const cues = useMemo(() => cueList?.cues || [], [cueList?.cues]);
  const currentCue = currentCueIndex >= 0 && currentCueIndex < cues.length ? cues[currentCueIndex] : null;
  const nextCue = currentCueIndex + 1 < cues.length ? cues[currentCueIndex + 1] : null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
    };
  }, []);

  const startFadeProgress = useCallback((duration: number) => {
    setFadeProgress(0);
    const startTime = Date.now();
    
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    
    fadeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / (duration * 1000)) * 100, 100);
      setFadeProgress(progress);
      
      if (progress >= 100) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }
    }, 50);
  }, []);

  const handlePlayCue = useCallback(async (cue: Cue, index: number) => {
    // Clear any existing timers
    if (followTimeoutRef.current) {
      clearTimeout(followTimeoutRef.current);
      followTimeoutRef.current = null;
    }

    setCurrentCueIndex(index);
    setIsPlaying(true);
    
    // Start fade progress animation
    startFadeProgress(cue.fadeInTime);

    // Play the cue with its fade in time
    await playCue({
      variables: {
        cueId: cue.id,
        fadeInTime: cue.fadeInTime,
      },
    });

    // If there's a follow time, automatically go to next cue
    if (cue.followTime && cue.followTime > 0 && index + 1 < cues.length) {
      const totalWaitTime = (cue.fadeInTime + cue.followTime) * 1000;
      const nextCueIndex = index + 1;
      const nextCueToPlay = cues[nextCueIndex];
      
      followTimeoutRef.current = setTimeout(() => {
        handlePlayCue(nextCueToPlay, nextCueIndex);
      }, totalWaitTime);
    } else {
      setIsPlaying(false);
    }
  }, [playCue, startFadeProgress, cues]);

  const handleNext = useCallback(() => {
    if (nextCue) {
      const nextIndex = currentCueIndex + 1;
      handlePlayCue(nextCue, nextIndex);
    }
  }, [nextCue, currentCueIndex, handlePlayCue]);

  const handlePrevious = useCallback(() => {
    if (currentCueIndex > 0) {
      const prevCue = cues[currentCueIndex - 1];
      handlePlayCue(prevCue, currentCueIndex - 1);
    }
  }, [currentCueIndex, cues, handlePlayCue]);

  const handleGo = useCallback(() => {
    if (currentCueIndex === -1 && cues.length > 0) {
      // Start from the beginning
      handlePlayCue(cues[0], 0);
    } else {
      // Go to next cue
      handleNext();
    }
  }, [currentCueIndex, cues, handlePlayCue, handleNext]);

  const handleStop = useCallback(async () => {
    // Clear any timers
    if (followTimeoutRef.current) {
      clearTimeout(followTimeoutRef.current);
      followTimeoutRef.current = null;
    }
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    setIsPlaying(false);
    setFadeProgress(0);

    // Fade to black
    await fadeToBlack({
      variables: {
        fadeOutTime: 3,
      },
    });

    setCurrentCueIndex(-1);
  }, [fadeToBlack]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      handleGo();
    } else if (e.key === 'Escape') {
      handleStop();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  }, [handleGo, handleStop, handlePrevious, handleNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <p className="text-white text-xl">Loading cue list...</p>
      </div>
    );
  }

  if (!cueList) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <p className="text-red-500 text-xl">Cue list not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{cueList.name}</h2>
            {cueList.description && (
              <p className="text-gray-400 mt-1">{cueList.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700"
            title="Close playback view"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cue List Table */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800/90 rounded-lg overflow-hidden shadow-lg">
          <table className="min-w-full">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Cue #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Scene</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">In</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Out</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Follow</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              {cues.map((cue: { id: string }, index: number) => (
                <CueRow
                  key={cue.id}
                  cue={cue}
                  index={index}
                  isActive={index === currentCueIndex}
                  isNext={index === currentCueIndex + 1}
                  isPrevious={index < currentCueIndex}
                  fadeProgress={index === currentCueIndex ? fadeProgress : undefined}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevious}
              disabled={currentCueIndex <= 0}
              className="inline-flex items-center px-4 py-3 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <button
              onClick={handleGo}
              disabled={isPlaying || (currentCueIndex >= cues.length - 1)}
              className="inline-flex items-center px-8 py-4 border border-transparent rounded-md text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentCueIndex === -1 ? 'START' : 'GO'}
              <span className="ml-2 text-sm font-normal">
                {nextCue ? `(${nextCue.cueNumber})` : ''}
              </span>
            </button>

            <button
              onClick={handleNext}
              disabled={!nextCue}
              className="inline-flex items-center px-4 py-3 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleStop}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
              STOP
            </button>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">
              Current: {currentCue ? `Cue ${currentCue.cueNumber} - ${currentCue.name}` : 'None'}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Next: {nextCue ? `Cue ${nextCue.cueNumber} - ${nextCue.name}` : 'End of list'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Keyboard: Space/Enter = GO | ← → = Navigate | Esc = Stop
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}