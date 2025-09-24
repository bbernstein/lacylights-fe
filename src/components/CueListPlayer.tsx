'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_CUE_LIST,
  GET_CUE_LIST_PLAYBACK_STATUS,
  START_CUE_LIST,
  NEXT_CUE,
  PREVIOUS_CUE,
  GO_TO_CUE,
  STOP_CUE_LIST,
  FADE_TO_BLACK
} from '@/graphql/cueLists';
import { useCueListPlayback } from '@/hooks/useCueListPlayback';
import { Cue } from '@/types';
import { convertCueIndexForLocalState } from '@/utils/cueListHelpers';

interface CueListPlayerProps {
  cueListId: string;
}

// Default fade out time in seconds for blackout operations
const DEFAULT_FADEOUT_TIME = 3;

export default function CueListPlayer({ cueListId }: CueListPlayerProps) {
  const { playbackStatus } = useCueListPlayback(cueListId);

  const { data: cueListData, loading } = useQuery(GET_CUE_LIST, {
    variables: { id: cueListId },
  });

  // Shared refetch configuration for cue list mutations
  const refetchConfig = useMemo(() => ({
    refetchQueries: [{ query: GET_CUE_LIST_PLAYBACK_STATUS, variables: { cueListId } }],
    awaitRefetchQueries: true,
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

  const cueList = cueListData?.cueList;
  const cues = useMemo(() => cueList?.cues || [], [cueList?.cues]);

  // Get current state from subscription data only
  const currentCueIndex = convertCueIndexForLocalState(playbackStatus?.currentCueIndex);
  const isPlaying = playbackStatus?.isPlaying || false;
  const fadeProgress = playbackStatus?.fadeProgress ?? 0;

  const currentCue = currentCueIndex >= 0 && currentCueIndex < cues.length ? cues[currentCueIndex] : null;
  const nextCue = currentCueIndex + 1 < cues.length ? cues[currentCueIndex + 1] : null;

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

  if (loading) {
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

      {/* Current Cue Display */}
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="text-center mb-8">
          {currentCue ? (
            <>
              <div className="text-6xl font-bold mb-2">
                {currentCue.cueNumber}
              </div>
              <div className="text-2xl text-gray-300 mb-4">
                {currentCue.name}
              </div>
              <div className="text-lg text-gray-400">
                Scene: {currentCue.scene.name}
              </div>
              {isPlaying && fadeProgress > 0 && fadeProgress < 100 && (
                <div className="mt-4 w-64 mx-auto">
                  <div className="bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${fadeProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-2xl text-gray-400">
              {cues.length > 0 ? 'Ready to start' : 'No cues in list'}
            </div>
          )}
        </div>

        {/* Next Cue Preview */}
        {nextCue && (
          <div className="bg-gray-800 rounded-lg p-4 max-w-md w-full">
            <div className="text-sm text-gray-400 mb-2">Next:</div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xl font-bold mr-3">{nextCue.cueNumber}</span>
                <span className="text-lg">{nextCue.name}</span>
              </div>
              <div className="text-sm text-gray-400">
                {nextCue.scene.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
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
            disabled={cues.length === 0 || (currentCueIndex >= cues.length - 1 && currentCueIndex !== -1)}
            className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
            title="GO (Space/Enter)"
          >
            {currentCueIndex === -1 ? 'START' : 'GO'}
          </button>

          {/* Next arrow button - provides familiar lighting console navigation alongside main GO button */}
          <button
            onClick={handleGo}
            disabled={!nextCue}
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