'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GET_CUE_LIST,
  GET_CUE_LIST_PLAYBACK_STATUS,
  START_CUE_LIST,
  NEXT_CUE,
  PREVIOUS_CUE,
  GO_TO_CUE,
  STOP_CUE_LIST,
  FADE_TO_BLACK,
  UPDATE_CUE_LIST,
  CREATE_CUE,
  UPDATE_CUE,
  DELETE_CUE,
} from '@/graphql/cueLists';
import { GET_PROJECT_SCENES, DUPLICATE_SCENE, ACTIVATE_SCENE } from '@/graphql/scenes';
import { useCueListPlayback } from '@/hooks/useCueListPlayback';
import { Cue } from '@/types';
import { convertCueIndexForLocalState } from '@/utils/cueListHelpers';
import { DEFAULT_FADEOUT_TIME } from '@/constants/playback';
import FadeProgressChart from './FadeProgressChart';
import { EasingType } from '@/utils/easing';
import AddCueDialog from './AddCueDialog';
import EditCueDialog from './EditCueDialog';
import ContextMenu from './ContextMenu';
import { PencilIcon } from '@heroicons/react/24/outline';

interface CueListPlayerProps {
  cueListId: string;
}


export default function CueListPlayer({ cueListId: cueListIdProp }: CueListPlayerProps) {
  // Helper to extract cueListId from URL if needed
  function extractCueListId(cueListIdProp: string): string {
    if (cueListIdProp === '__dynamic__' && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/player\/([^\/]+)/);
      return match?.[1] || cueListIdProp;
    }
    return cueListIdProp;
  }

  const router = useRouter();
  const searchParams = useSearchParams();

  const [actualCueListId, setActualCueListId] = useState<string>(() => extractCueListId(cueListIdProp));
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCueRef = useRef<HTMLDivElement>(null);

  // State for the slide-off animation after fade completes
  const [slideOffProgress, setSlideOffProgress] = useState<number>(0);
  const slideOffStartTime = useRef<number | null>(null);
  const slideOffDuration = useRef<number>(0);
  const slideOffAnimationFrame = useRef<number | null>(null);
  const prevCueIndex = useRef<number>(-1);

  // Track the previous cue that's fading out during transition
  const [fadingOutCueIndex, setFadingOutCueIndex] = useState<number | null>(null);

  // Add Cue Dialog state
  const [showAddCueDialog, setShowAddCueDialog] = useState(false);

  // Highlight state for cue that was just edited
  const [highlightedCueId, setHighlightedCueId] = useState<string | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cue: Cue;
    cueIndex: number;
  } | null>(null);
  const [showEditCueDialog, setShowEditCueDialog] = useState(false);
  const [editingCue, setEditingCue] = useState<Cue | null>(null);

  // Long-press detection refs
  const longPressTimer = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setActualCueListId(extractCueListId(cueListIdProp));
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
  const [createCue] = useMutation(CREATE_CUE);
  const [updateCue] = useMutation(UPDATE_CUE);
  const [deleteCue] = useMutation(DELETE_CUE);
  const [duplicateScene] = useMutation(DUPLICATE_SCENE);
  const [activateScene] = useMutation(ACTIVATE_SCENE);

  // Fetch scenes for the Add Cue dialog
  const { data: scenesData } = useQuery(GET_PROJECT_SCENES, {
    variables: { projectId: cueListData?.cueList?.project?.id || '' },
    skip: !cueListData?.cueList?.project?.id || isDynamicPlaceholder,
  });

  const cueList = cueListData?.cueList;
  const cues = useMemo(() => cueList?.cues || [], [cueList?.cues]);
  const scenes = scenesData?.project?.scenes || [];

  // Get current state from subscription data only
  const currentCueIndex = convertCueIndexForLocalState(playbackStatus?.currentCueIndex);
  // isPlaying = scene is active on DMX, isFading = fade transition in progress
  const isPlaying = playbackStatus?.isPlaying || false;
  const isFading = playbackStatus?.isFading || false;
  const fadeProgress = playbackStatus?.fadeProgress ?? 0;

  // Get the current cue - intentionally kept for future use and debugging
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _currentCue = currentCueIndex >= 0 && currentCueIndex < cues.length
    ? cues[currentCueIndex]
    : null;

  // Helper to format time values
  const formatTime = (seconds: number): string => {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    }
    if (seconds === Math.floor(seconds)) {
      return `${seconds}s`;
    }
    return `${seconds.toFixed(1)}s`;
  };

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

  // Display all cues with proper state indicators
  const displayCues = useMemo(() => {
    // Determine if first cue should be marked as "next" due to loop
    const isLoopingToFirst = cueList?.loop && currentCueIndex === cues.length - 1;

    return cues.map((cue: Cue, i: number) => {
      // Only mark immediate previous (one before current)
      const isPrevious = i === currentCueIndex - 1;

      // Only mark immediate next (one after current, or first if looping from last)
      const isNext = i === currentCueIndex + 1 || (isLoopingToFirst && i === 0);

      return {
        cue,
        index: i,
        isCurrent: i === currentCueIndex,
        isPrevious,
        isNext
      };
    });
  }, [currentCueIndex, cues, cueList?.loop]);

  // Auto-scroll to current cue when it changes
  useEffect(() => {
    if (currentCueRef.current && currentCueIndex >= 0) {
      currentCueRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [currentCueIndex]);

  // Track cue changes and fade-out visualization for previous cue
  useEffect(() => {
    // Handle cue change - track the previous cue for fade-out visualization
    if (currentCueIndex !== prevCueIndex.current) {
      setSlideOffProgress(0);
      slideOffStartTime.current = null;

      // If there was a previous cue, mark it as fading out
      if (prevCueIndex.current >= 0) {
        setFadingOutCueIndex(prevCueIndex.current);
      }

      prevCueIndex.current = currentCueIndex;
      return;
    }

    // Clear the fading out cue when current cue's fade completes (isFading becomes false)
    if (!isFading && fadingOutCueIndex !== null) {
      setFadingOutCueIndex(null);
    }
  }, [currentCueIndex, isFading, fadingOutCueIndex]);

  // Slide-off animation: after fade completes, animate the curve sliding off to the left
  useEffect(() => {
    // Cleanup function for animation frame
    const cleanup = () => {
      if (slideOffAnimationFrame.current !== null) {
        cancelAnimationFrame(slideOffAnimationFrame.current);
        slideOffAnimationFrame.current = null;
      }
    };

    // Start slide-off when fade completes (isFading changes from true to false)
    if (!isFading && isPlaying && currentCueIndex >= 0 && currentCueIndex < cues.length) {
      // Only start if not already animating
      if (slideOffStartTime.current === null) {
        const currentCueData = cues[currentCueIndex];
        slideOffDuration.current = currentCueData.fadeInTime * 1000; // Same duration as fade-in
        slideOffStartTime.current = performance.now();
        setSlideOffProgress(0);

        const animate = (timestamp: number) => {
          if (slideOffStartTime.current === null) return;

          const elapsed = timestamp - slideOffStartTime.current;
          const progress = Math.min(100, (elapsed / slideOffDuration.current) * 100);

          setSlideOffProgress(progress);

          if (progress < 100) {
            slideOffAnimationFrame.current = requestAnimationFrame(animate);
          } else {
            slideOffAnimationFrame.current = null;
          }
        };

        slideOffAnimationFrame.current = requestAnimationFrame(animate);
      }
    }

    // Reset slide-off when a new fade starts
    if (isFading && slideOffProgress > 0) {
      cleanup();
      setSlideOffProgress(0);
      slideOffStartTime.current = null;
    }

    return cleanup;
  }, [isFading, isPlaying, currentCueIndex, cues, slideOffProgress]);

  // Memoize the disable condition to avoid repetition
  // When loop is enabled, GO button should always work (even at last cue)
  const isGoDisabled = useMemo(() => {
    if (cues.length === 0) return true;
    if (cueList?.loop) return false; // Loop enabled, always allow GO
    return currentCueIndex >= cues.length - 1 && currentCueIndex !== -1;
  }, [cues.length, currentCueIndex, cueList?.loop]);

  // Handle highlight parameter from URL (when returning from scene editor)
  useEffect(() => {
    const highlightCueNumber = searchParams.get('highlightCue');
    if (highlightCueNumber && cues.length > 0) {
      const cueToHighlight = cues.find((c: Cue) => c.cueNumber === parseFloat(highlightCueNumber));
      if (cueToHighlight) {
        setHighlightedCueId(cueToHighlight.id);

        // Remove highlight after 2 seconds
        const timeout = setTimeout(() => {
          setHighlightedCueId(null);
        }, 2000);

        return () => clearTimeout(timeout);
      }
    }
  }, [searchParams, cues]);

  // Handle Add Cue
  const handleAddCue = useCallback(
    async (params: {
      cueNumber: number;
      name: string;
      sceneId: string;
      createCopy: boolean;
      fadeInTime: number;
      fadeOutTime: number;
      followTime?: number;
      action: 'edit' | 'stay';
    }) => {
      if (!cueList) return;

      try {
        // Duplicate scene if requested
        let targetSceneId = params.sceneId;
        if (params.createCopy) {
          const duplicateResult = await duplicateScene({
            variables: { id: params.sceneId },
          });
          targetSceneId = duplicateResult.data?.duplicateScene?.id || params.sceneId;
        }

        // Create the cue
        const createResult = await createCue({
          variables: {
            input: {
              cueNumber: params.cueNumber,
              name: params.name,
              cueListId: cueList.id,
              sceneId: targetSceneId,
              fadeInTime: params.fadeInTime,
              fadeOutTime: params.fadeOutTime,
              followTime: params.followTime,
            },
          },
          refetchQueries: [{ query: GET_CUE_LIST, variables: { id: cueList.id } }],
        });

        const newCueId = createResult.data?.createCue?.id;

        if (params.action === 'edit' && targetSceneId) {
          // Activate the scene before navigation to prevent blackout
          await activateScene({
            variables: { sceneId: targetSceneId },
          });

          // Navigate to scene editor in layout mode
          router.push(
            `/scenes/${targetSceneId}/edit?mode=layout&fromPlayer=true&cueListId=${cueList.id}&returnCueNumber=${params.cueNumber}`
          );
        }

        // If action is 'stay', the dialog will close and the cue list will refetch
        // The new cue will appear in the list
        if (params.action === 'stay' && newCueId) {
          // Optionally highlight the new cue
          setHighlightedCueId(newCueId);
          setTimeout(() => setHighlightedCueId(null), 2000);
        }
      } catch (error) {
        console.error('Failed to add cue:', error);
      }
    },
    [cueList, createCue, duplicateScene, activateScene, router]
  );

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

  // Context menu handlers
  const handleCueContextMenu = useCallback(
    (e: React.MouseEvent, cue: Cue, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        cue,
        cueIndex: index,
      });
    },
    []
  );

  // Long-press detection
  const startLongPressDetection = useCallback(
    (x: number, y: number, cue: Cue, index: number) => {
      touchStart.current = { x, y };
      longPressTimer.current = window.setTimeout(() => {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        setContextMenu({ x, y, cue, cueIndex: index });
      }, 500);
    },
    []
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStart.current = null;
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, cue: Cue, index: number) => {
      const touch = e.touches[0];
      // Prevent text selection during long-press detection
      e.preventDefault();
      startLongPressDetection(touch.clientX, touch.clientY, cue, index);
    },
    [startLongPressDetection]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStart.current.x);
      const dy = Math.abs(touch.clientY - touchStart.current.y);
      if (dx > 10 || dy > 10) {
        cancelLongPress();
      }
    },
    [cancelLongPress]
  );

  const handleTouchEnd = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  // Context menu option handlers
  const handleEditCue = useCallback(() => {
    if (!contextMenu) return;
    setEditingCue(contextMenu.cue);
    setShowEditCueDialog(true);
    setContextMenu(null);
  }, [contextMenu]);

  const handleContextMenuEditScene = useCallback(
    async (cue: Cue) => {
      // Activate scene to prevent blackout
      await activateScene({
        variables: { sceneId: cue.scene.id },
      });
      // Navigate to scene editor with fromPlayer params
      router.push(
        `/scenes/${cue.scene.id}/edit?mode=layout&fromPlayer=true&cueListId=${cueListId}&returnCueNumber=${cue.cueNumber}`
      );
      setContextMenu(null);
    },
    [activateScene, router, cueListId]
  );

  const handleDuplicateCue = useCallback(
    async () => {
      if (!contextMenu || !cueList) return;
      const { cue } = contextMenu;

      try {
        // Duplicate the scene
        const duplicateResult = await duplicateScene({
          variables: { id: cue.scene.id },
        });
        const newSceneId = duplicateResult.data?.duplicateScene?.id;

        // Create new cue with next decimal number
        const newCueNumber = cue.cueNumber + 0.1;
        await createCue({
          variables: {
            input: {
              cueNumber: newCueNumber,
              name: `${cue.name} (copy)`,
              cueListId: cueList.id,
              sceneId: newSceneId || cue.scene.id,
              fadeInTime: cue.fadeInTime,
              fadeOutTime: cue.fadeOutTime,
              followTime: cue.followTime,
            },
          },
          refetchQueries: [{ query: GET_CUE_LIST, variables: { id: cueList.id } }],
        });
      } catch (error) {
        console.error('Failed to duplicate cue:', error);
      }
      setContextMenu(null);
    },
    [contextMenu, cueList, duplicateScene, createCue]
  );

  const handleAddCueFromContextMenu = useCallback(() => {
    if (!contextMenu) return;
    setShowAddCueDialog(true);
    setContextMenu(null);
  }, [contextMenu]);

  const handleContextMenuDeleteCue = useCallback(() => {
    if (!contextMenu) return;
    const { cue } = contextMenu;

    if (window.confirm(`Delete cue "${cue.name}"?`)) {
      deleteCue({
        variables: { id: cue.id },
        refetchQueries: [{ query: GET_CUE_LIST, variables: { id: cueListId } }],
      });
    }
    setContextMenu(null);
  }, [contextMenu, deleteCue, cueListId]);

  // EditCueDialog update handler
  const handleEditCueDialogUpdate = useCallback(
    async (params: {
      cueId: string;
      cueNumber?: number;
      name?: string;
      sceneId?: string;
      fadeInTime?: number;
      fadeOutTime?: number;
      followTime?: number;
      action: 'edit-scene' | 'stay';
    }) => {
      try {
        // Update the cue
        await updateCue({
          variables: {
            id: params.cueId,
            input: {
              name: params.name,
              cueNumber: params.cueNumber,
              cueListId: cueList?.id,
              sceneId: params.sceneId,
              fadeInTime: params.fadeInTime,
              fadeOutTime: params.fadeOutTime,
              followTime: params.followTime,
            },
          },
          refetchQueries: [{ query: GET_CUE_LIST, variables: { id: cueListId } }],
        });

        if (params.action === 'edit-scene' && params.sceneId) {
          // Activate scene and navigate to editor
          await activateScene({
            variables: { sceneId: params.sceneId },
          });
          router.push(
            `/scenes/${params.sceneId}/edit?mode=layout&fromPlayer=true&cueListId=${cueListId}&returnCueNumber=${params.cueNumber}`
          );
        }

        setShowEditCueDialog(false);
        setEditingCue(null);
      } catch (error) {
        console.error('Failed to update cue:', error);
      }
    },
    [cueList, cueListId, updateCue, activateScene, router]
  );

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
    <div className="absolute inset-0 bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h1 className="text-lg font-bold">{cueList.name}</h1>
        {cueList.description && (
          <p className="text-sm text-gray-400 mt-1">{cueList.description}</p>
        )}
      </div>

      {/* Cue Display - shows all cues with auto-scroll to current */}
      <div ref={containerRef} className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
        {displayCues.length > 0 ? (
          <div className="w-full max-w-2xl space-y-3">
            {displayCues.map(({ cue, index, isCurrent, isPrevious, isNext }: { cue: Cue; index: number; isCurrent: boolean; isPrevious: boolean; isNext: boolean }) => (
              <div
                key={cue.id}
                ref={isCurrent ? currentCueRef : null}
                className={`relative rounded-lg p-4 border transition-all duration-200 overflow-hidden select-none ${
                  cue.id === highlightedCueId
                    ? 'bg-gray-700 border-yellow-500 border-2 shadow-lg animate-pulse'
                    : isCurrent
                    ? 'bg-gray-700 border-green-500 border-2 scale-[1.02] shadow-lg'
                    : isPrevious
                    ? 'bg-gray-800/50 border-gray-600 opacity-60'
                    : isNext
                    ? 'bg-gray-800/70 border-gray-600 opacity-80'
                    : 'bg-gray-800 border-gray-700'
                } ${!isCurrent ? 'cursor-pointer hover:bg-gray-700/70' : ''}`}
                onClick={() => !isCurrent && handleJumpToCue(index)}
                onContextMenu={(e) => handleCueContextMenu(e, cue, index)}
                onTouchStart={(e) => handleTouchStart(e, cue, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Fade progress chart as full background for current cue */}
                {/* Show when scene is playing (active on DMX), with progress during fade or 100% when holding */}
                {isCurrent && isPlaying && (
                  <div className="absolute inset-0 opacity-30">
                    <FadeProgressChart
                      progress={isFading ? fadeProgress : 100}
                      slideOffProgress={!isFading ? slideOffProgress : 0}
                      easingType={(cue.easingType as EasingType) || 'EASE_IN_OUT_SINE'}
                      className="w-full h-full"
                    />
                  </div>
                )}

                {/* Fade-out chart for previous cue during transition */}
                {/* Shows inverted progress (100% → 0%) as new cue fades in */}
                {fadingOutCueIndex === index && isFading && (
                  <div className="absolute inset-0 opacity-30">
                    <FadeProgressChart
                      progress={100 - fadeProgress}
                      easingType={(cue.easingType as EasingType) || 'EASE_IN_OUT_SINE'}
                      className="w-full h-full"
                      variant="fadeOut"
                    />
                  </div>
                )}

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`text-2xl font-bold ${isCurrent ? 'text-green-400' : 'text-gray-300'}`}>
                      {cue.cueNumber}
                    </div>
                    <div className="flex-1">
                      <div className={`text-lg ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                        {cue.name}
                      </div>
                      <div className={`text-sm ${isCurrent ? 'text-gray-300' : 'text-gray-500'}`}>
                        Scene: {cue.scene.name}
                      </div>
                      {/* Timing info */}
                      <div className={`text-xs mt-1 flex gap-3 ${isCurrent ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span>In: {formatTime(cue.fadeInTime)}</span>
                        <span>Out: {formatTime(cue.fadeOutTime)}</span>
                        {cue.followTime !== undefined && cue.followTime > 0 && (
                          <span className="text-blue-400">Follow: {formatTime(cue.followTime)}</span>
                        )}
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

      {/* Add Cue Dialog */}
      <AddCueDialog
        isOpen={showAddCueDialog}
        onClose={() => setShowAddCueDialog(false)}
        cueListId={cueList.id}
        currentCueNumber={currentCueIndex >= 0 ? cues[currentCueIndex]?.cueNumber || currentCueIndex : -1}
        currentSceneId={currentCueIndex >= 0 ? cues[currentCueIndex]?.scene?.id || null : null}
        scenes={scenes}
        defaultFadeInTime={cueList.defaultFadeInTime || 3}
        defaultFadeOutTime={cueList.defaultFadeOutTime || 3}
        onAdd={handleAddCue}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={[
            {
              label: 'Edit Cue',
              onClick: handleEditCue,
              icon: (
                <PencilIcon className="w-4 h-4" />
              ),
            },
            {
              label: 'Edit Scene',
              onClick: () => handleContextMenuEditScene(contextMenu.cue),
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              ),
            },
            {
              label: 'Duplicate Cue',
              onClick: handleDuplicateCue,
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ),
            },
            {
              label: 'Add Cue',
              onClick: handleAddCueFromContextMenu,
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ),
            },
            {
              label: 'Delete Cue',
              onClick: handleContextMenuDeleteCue,
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ),
              className: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300',
            },
          ]}
          onDismiss={() => setContextMenu(null)}
        />
      )}

      {/* Edit Cue Dialog */}
      {showEditCueDialog && editingCue && (
        <EditCueDialog
          isOpen={showEditCueDialog}
          onClose={() => {
            setShowEditCueDialog(false);
            setEditingCue(null);
          }}
          cue={editingCue}
          scenes={scenes}
          onUpdate={handleEditCueDialogUpdate}
        />
      )}
    </div>
  );
}