'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_CUE_LIST,
  GET_CUE_LIST_PLAYBACK_STATUS,
  START_CUE_LIST,
  NEXT_CUE,
  PREVIOUS_CUE,
  GO_TO_CUE,
  STOP_CUE_LIST,
  FADE_TO_BLACK,
  UPDATE_CUE_LIST
} from '@/graphql/cueLists';
import { useCueListPlayback } from '@/hooks/useCueListPlayback';
import { Cue } from '@/types';
import { convertCueIndexForLocalState } from '@/utils/cueListHelpers';
import { DEFAULT_FADEOUT_TIME } from '@/constants/playback';

interface CueListPlayerProps {
  cueListId: string;
}


export default function CueListPlayer({ cueListId: cueListIdProp }: CueListPlayerProps) {
  // Extract actual cueListId from URL if we received the __dynamic__ placeholder
  const [actualCueListId, setActualCueListId] = useState<string>(() => {
    if (cueListIdProp === '__dynamic__' && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/player\/([^\/]+)/);
      return match?.[1] || cueListIdProp;
    }
    return cueListIdProp;
  });

  useEffect(() => {
    if (cueListIdProp === '__dynamic__') {
      // Extract cueListId from URL pathname
      // URL pattern is /player/[cueListId]
      const pathname = window.location.pathname;
      const match = pathname.match(/\/player\/([^\/]+)/);
      if (match && match[1]) {
        setActualCueListId(match[1]);
      }
    } else {
      setActualCueListId(cueListIdProp);
    }
  }, [cueListIdProp]);

  const cueListId = actualCueListId;
  const isDynamicPlaceholder = cueListId === '__dynamic__';

  // Call all hooks unconditionally (required by React)
  const { playbackStatus } = useCueListPlayback(cueListId);

  const { data: cueListData, loading } = useQuery(GET_CUE_LIST, {
    variables: { id: cueListId },
    skip: isDynamicPlaceholder,
  });

  // Shared refetch configuration for cue list mutations
  const refetchConfig = useMemo(() => ({
    refetchQueries: [{ query: GET_CUE_LIST_PLAYBACK_STATUS, variables: { cueListId } }],
  }), [cueListId]);

  // Refetch configuration for fadeToBlack (no await needed for global fade)
  const fadeToBlackRefetchConfig = useMemo(() => ({
    refetchQueries: [{ query: GET_CUE_LIST_PLAYBACK_STATUS, variables: { cueListId } }],
  }), [cueListId]);

  const [startCueList] = useMutation(START_CUE_LIST, refetchConfig);
  const [nextCueMutation] = useMutation(NEXT_CUE, refetchConfig);
  const [previousCueMutation] = useMutation(PREVIOUS_CUE, refetchConfig);
  const [goToCue] = useMutation(GO_TO_CUE, refetchConfig);
  const [stopCueList] = useMutation(STOP_CUE_LIST, refetchConfig);
  const [fadeToBlack] = useMutation(FADE_TO_BLACK, fadeToBlackRefetchConfig);
  const [updateCueList] = useMutation(UPDATE_CUE_LIST);

  const cueList = cueListData?.cueList;
  const cues = useMemo(() => cueList?.cues || [], [cueList?.cues]);

  // Get current state from subscription data only
  const currentCueIndex = convertCueIndexForLocalState(playbackStatus?.currentCueIndex);
  const isPlaying = playbackStatus?.isPlaying || false;
  const fadeProgress = playbackStatus?.fadeProgress ?? 0;

  // Calculate next cue with loop support
  const nextCue = useMemo(() => {
    if (currentCueIndex + 1 < cues.length) {
      return cues[currentCueIndex + 1];
    }
    // If on last cue and loop is enabled, next cue is the first cue
    if (cueList?.loop && cues.length > 0 && currentCueIndex === cues.length - 1) {
      return cues[0];
    }
    return null;
  }, [currentCueIndex, cues, cueList?.loop]);

  // Get cues for the 5-cue display (2 previous + current + 2 next)
  const displayCues = useMemo(() => {
    const cuesForDisplay = [];

    // Determine if first cue should be marked as "next" due to loop
    const isLoopingToFirst = cueList?.loop && currentCueIndex === cues.length - 1;

    for (let i = currentCueIndex - 2; i <= currentCueIndex + 2; i++) {
      if (i >= 0 && i < cues.length) {
        const isNext = i > currentCueIndex || (isLoopingToFirst && i === 0);

        cuesForDisplay.push({
          cue: cues[i],
          index: i,
          isCurrent: i === currentCueIndex,
          isPrevious: i < currentCueIndex && !(isLoopingToFirst && i === 0),
          isNext: isNext && i !== currentCueIndex
        });
      }
    }

    return cuesForDisplay;
  }, [currentCueIndex, cues, cueList?.loop]);

  // Memoize the disable condition to avoid repetition
  // When loop is enabled, GO button should always work (even at last cue)
  const isGoDisabled = useMemo(() => {
    if (cues.length === 0) return true;
    if (cueList?.loop) return false; // Loop enabled, always allow GO
    return currentCueIndex >= cues.length - 1 && currentCueIndex !== -1;
  }, [cues.length, currentCueIndex, cueList?.loop]);

  const handleGo = useCallback(async () => {
    if (!cueList) return;

    if (currentCueIndex === -1 && cues.length > 0) {
      await startCueList({
        variables: {
          cueListId: cueList.id,
          startFromCue: 0,
        },
      });
    } else if (nextCue) {
      await nextCueMutation({
        variables: {
          cueListId: cueList.id,
          fadeInTime: nextCue.fadeInTime,
        },
      });
    }
  }, [currentCueIndex, cues, cueList, startCueList, nextCueMutation, nextCue]);

  const handlePrevious = useCallback(async () => {
    if (!cueList || currentCueIndex <= 0) return;

    await previousCueMutation({
      variables: {
        cueListId: cueList.id,
        fadeInTime: cues[currentCueIndex - 1]?.fadeInTime,
      },
    });
  }, [previousCueMutation, cueList, currentCueIndex, cues]);

  const handleStop = useCallback(async () => {
    if (!cueList) return;

    await stopCueList({
      variables: {
        cueListId: cueList.id,
      },
    });

    await fadeToBlack({
      variables: {
        fadeOutTime: DEFAULT_FADEOUT_TIME,
      },
    });
  }, [cueList, stopCueList, fadeToBlack]);

  const handleToggleLoop = useCallback(async () => {
    if (!cueList) return;

    await updateCueList({
      variables: {
        id: cueList.id,
        input: {
          name: cueList.name,
          description: cueList.description || undefined,
          loop: !cueList.loop,
          projectId: cueList.project.id,
        },
      },
      refetchQueries: [{ query: GET_CUE_LIST, variables: { id: cueList.id } }],
    });
  }, [cueList, updateCueList]);

  const handleJumpToCue = useCallback(async (index: number) => {
    if (!cueList || index < 0 || index >= cues.length) return;

    const cue = cues[index];
    await goToCue({
      variables: {
        cueListId: cueList.id,
        cueIndex: index,
        fadeInTime: cue.fadeInTime,
      },
    });
  }, [goToCue, cueList, cues]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleGo();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handlePrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (nextCue) {
          handleGo();
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleStop();
        break;
    }
  }, [handleGo, handlePrevious, handleStop, nextCue]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (loading || isDynamicPlaceholder) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (!cueList) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <p>Cue list not found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h1 className="text-lg font-bold">{cueList.name}</h1>
        {cueList.description && (
          <p className="text-sm text-gray-400 mt-1">{cueList.description}</p>
        )}
      </div>

      {/* Cue Display with 2 Previous + Current + 2 Next */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 overflow-y-auto">
        {displayCues.length > 0 ? (
          <div className="w-full max-w-2xl space-y-3">
            {displayCues.map(({ cue, index, isCurrent, isPrevious, isNext }) => (
              <div
                key={cue.id}
                className={`relative rounded-lg p-4 border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-gray-700 border-green-500 border-2 scale-105 shadow-lg'
                    : isPrevious
                    ? 'bg-gray-800/50 border-gray-600 opacity-60'
                    : isNext
                    ? 'bg-gray-800/70 border-gray-600 opacity-80'
                    : 'bg-gray-800 border-gray-700'
                } ${!isCurrent ? 'cursor-pointer hover:bg-gray-700/70' : ''}`}
                onClick={() => !isCurrent && handleJumpToCue(index)}
              >
                {/* Fade progress background for current cue */}
                {isCurrent && isPlaying && fadeProgress > 0 && fadeProgress < 100 && (
                  <div
                    className="absolute inset-0 bg-green-600/20 rounded-lg transition-all duration-75"
                    style={{ width: `${fadeProgress}%` }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`text-2xl font-bold ${isCurrent ? 'text-green-400' : 'text-gray-300'}`}>
                      {cue.cueNumber}
                    </div>
                    <div>
                      <div className={`text-lg ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                        {cue.name}
                      </div>
                      <div className={`text-sm ${isCurrent ? 'text-gray-300' : 'text-gray-500'}`}>
                        Scene: {cue.scene.name}
                      </div>
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex flex-col items-end space-y-1">
                    {isCurrent && (
                      <span className="text-xs font-medium text-green-400 bg-green-900/50 px-2 py-1 rounded">
                        LIVE
                      </span>
                    )}
                    {isPrevious && (
                      <span className="text-xs text-gray-500">
                        PREVIOUS
                      </span>
                    )}
                    {isNext && (
                      <span className="text-xs text-blue-400">
                        NEXT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-2xl text-gray-400 text-center">
            {cues.length > 0 ? 'Ready to start' : 'No cues in list'}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Loop toggle button */}
          <button
            onClick={handleToggleLoop}
            className={`p-3 rounded-lg transition-colors ${
              cueList.loop
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title={cueList.loop ? 'Loop enabled - Click to disable' : 'Loop disabled - Click to enable'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handlePrevious}
            disabled={currentCueIndex <= 0}
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous (←)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleGo}
            disabled={isGoDisabled}
            className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
            title="GO (Space/Enter)"
          >
            {currentCueIndex === -1 ? 'START' : 'GO'}
          </button>

          {/* Next arrow button - provides familiar lighting console navigation alongside main GO button */}
          <button
            onClick={handleGo}
            disabled={isGoDisabled}
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next (→)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleStop}
            className="p-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
            title="Stop (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
            </svg>
          </button>
        </div>

        {/* Cue List Progress */}
        <div className="mt-4 flex items-center justify-center space-x-2">
          {cues.map((cue: Cue, index: number) => (
            <button
              key={cue.id}
              onClick={() => handleJumpToCue(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentCueIndex
                  ? 'bg-green-500 w-3 h-3'
                  : index < currentCueIndex
                  ? 'bg-gray-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={`${cue.cueNumber}: ${cue.name}`}
            />
          ))}
        </div>

        <div className="mt-3 text-center text-xs text-gray-500">
          Space/Enter = GO | ← → = Navigate | Esc = Stop
        </div>
      </div>
    </div>
  );
}