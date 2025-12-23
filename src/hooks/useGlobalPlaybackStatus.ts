import { useQuery, useSubscription } from '@apollo/client';
import { useState, useEffect } from 'react';
import { GET_GLOBAL_PLAYBACK_STATUS, GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION } from '../graphql/cueLists';
import { GlobalPlaybackStatus } from '../types';
import { FADE_PROGRESS_THRESHOLD } from '../constants/playback';

interface UseGlobalPlaybackStatusResult {
  playbackStatus: GlobalPlaybackStatus | null;
  isLoading: boolean;
  error?: Error;
}

/**
 * Hook to get the global playback status - which cue list is currently playing (if any).
 * Subscribes to real-time updates via WebSocket.
 */
export function useGlobalPlaybackStatus(): UseGlobalPlaybackStatusResult {
  const [playbackStatus, setPlaybackStatus] = useState<GlobalPlaybackStatus | null>(null);

  // Query initial playback status
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(GET_GLOBAL_PLAYBACK_STATUS, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Subscribe to real-time updates
  const { loading: subscriptionLoading, error: subscriptionError } = useSubscription(GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION, {
    shouldResubscribe: true,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.globalPlaybackStatusUpdated) {
        const newStatus = subscriptionData.data.globalPlaybackStatusUpdated;
        setPlaybackStatus(prevStatus => {
          if (!prevStatus) return newStatus;

          // Prioritize important state changes (playing status, cue index, fading status)
          if (prevStatus.isPlaying !== newStatus.isPlaying ||
              prevStatus.cueListId !== newStatus.cueListId ||
              prevStatus.currentCueIndex !== newStatus.currentCueIndex ||
              prevStatus.isFading !== newStatus.isFading) {
            return newStatus;
          }

          // For fade progress-only changes, use a threshold to avoid excessive updates.
          // A 1 percentage point delta (FADE_PROGRESS_THRESHOLD) is chosen as a balance
          // between smooth UI updates and reducing unnecessary re-renders.
          const prevProgress = prevStatus.fadeProgress ?? 0;
          const newProgress = newStatus.fadeProgress ?? 0;
          if (Math.abs(prevProgress - newProgress) < FADE_PROGRESS_THRESHOLD) {
            return prevStatus; // Skip fade progress changes smaller than threshold
          }

          return newStatus;
        });
      }
    },
  });

  // Update state from query data (initial load and refetches)
  // Apply the same throttling logic as subscription updates for consistency
  useEffect(() => {
    if (queryData?.globalPlaybackStatus) {
      const newStatus = queryData.globalPlaybackStatus as GlobalPlaybackStatus;
      setPlaybackStatus(prevStatus => {
        if (!prevStatus) return newStatus;

        // Prioritize important state changes (playing status, cue index, fading status)
        if (prevStatus.isPlaying !== newStatus.isPlaying ||
            prevStatus.cueListId !== newStatus.cueListId ||
            prevStatus.currentCueIndex !== newStatus.currentCueIndex ||
            prevStatus.isFading !== newStatus.isFading) {
          return newStatus;
        }

        // For fade progress-only changes, use a threshold to avoid excessive updates.
        const prevProgress = prevStatus.fadeProgress ?? 0;
        const newProgress = newStatus.fadeProgress ?? 0;
        if (Math.abs(prevProgress - newProgress) < FADE_PROGRESS_THRESHOLD) {
          return prevStatus; // Skip fade progress changes smaller than threshold
        }

        return newStatus;
      });
    }
  }, [queryData]);

  // Use local state if available, otherwise fall back to query data
  const effectivePlaybackStatus = playbackStatus || queryData?.globalPlaybackStatus || null;

  return {
    playbackStatus: effectivePlaybackStatus,
    isLoading: queryLoading || subscriptionLoading,
    error: (queryError || subscriptionError) as Error | undefined,
  };
}
