import { useQuery, useSubscription } from '@apollo/client';
import { useState, useEffect } from 'react';
import { GET_CUE_LIST_PLAYBACK_STATUS, CUE_LIST_PLAYBACK_SUBSCRIPTION } from '../graphql/cueLists';
import { CueListPlaybackStatus } from '../types';
import { FADE_PROGRESS_THRESHOLD } from '@/constants/playback';

interface UseCueListPlaybackResult {
  playbackStatus: CueListPlaybackStatus | null;
  isLoading: boolean;
  error?: Error;
}

export function useCueListPlayback(cueListId: string): UseCueListPlaybackResult {
  const [playbackStatus, setPlaybackStatus] = useState<CueListPlaybackStatus | null>(null);

  // Query initial playback status
  // Use 'cache-and-network' so we receive updates when refetchQueries updates the cache
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(GET_CUE_LIST_PLAYBACK_STATUS, {
    variables: { cueListId },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Subscribe to real-time updates
  const { loading: subscriptionLoading, error: subscriptionError } = useSubscription(CUE_LIST_PLAYBACK_SUBSCRIPTION, {
    variables: { cueListId },
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.cueListPlaybackUpdated) {
        const newStatus = subscriptionData.data.cueListPlaybackUpdated;
        // Only update if data has meaningfully changed
        setPlaybackStatus(prevStatus => {
          if (!prevStatus) return newStatus;

          // Prioritize important state changes (cue index and playing status)
          if (prevStatus.currentCueIndex !== newStatus.currentCueIndex ||
              prevStatus.isPlaying !== newStatus.isPlaying) {
            return newStatus; // Always update for important state changes
          }

          // For fade progress-only changes, use threshold to avoid excessive updates
          const prevProgress = prevStatus.fadeProgress ?? 0;
          const newProgress = newStatus.fadeProgress ?? 0;
          if (Math.abs(prevProgress - newProgress) < FADE_PROGRESS_THRESHOLD) {
            return prevStatus; // Skip minor fade progress changes
          }

          return newStatus;
        });
      }
    },
    // Note: Manual state reset on cueListId change is intentionally omitted
    // Apollo Client automatically handles subscription cleanup and re-subscription
    // when variables change. Manual reset creates race conditions where
    // playbackStatus becomes temporarily null even when valid data is available.
    // The subscription will naturally update with new data for the new cueListId.
  });

  // Update state from query data (initial load and refetches)
  // This handles both initial load and refetches triggered by mutations
  useEffect(() => {
    if (queryData?.cueListPlaybackStatus) {
      const newStatus = queryData.cueListPlaybackStatus;
      setPlaybackStatus(prevStatus => {
        if (!prevStatus) return newStatus;

        // Always update for important state changes (cue index and playing status)
        if (prevStatus.currentCueIndex !== newStatus.currentCueIndex ||
            prevStatus.isPlaying !== newStatus.isPlaying) {
          return newStatus;
        }

        // For fade progress-only changes, use threshold to avoid excessive updates
        const prevProgress = prevStatus.fadeProgress ?? 0;
        const newProgress = newStatus.fadeProgress ?? 0;
        if (Math.abs(prevProgress - newProgress) < FADE_PROGRESS_THRESHOLD) {
          return prevStatus;
        }

        return newStatus;
      });
    }
  }, [queryData]);

  return {
    playbackStatus,
    isLoading: queryLoading || subscriptionLoading,
    error: (queryError || subscriptionError) as Error | undefined,
  };
}
