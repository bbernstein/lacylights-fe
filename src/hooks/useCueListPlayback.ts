import { useQuery, useSubscription } from '@apollo/client';
import { useState, useEffect } from 'react';
import { GET_CUE_LIST_PLAYBACK_STATUS, CUE_LIST_PLAYBACK_SUBSCRIPTION } from '../graphql/cueLists';
import { CueListPlaybackStatus } from '../types';

// Threshold for fade progress comparison (in percentage points).
// Only update playback status if fadeProgress changes by at least 1 percentage point,
// to avoid unnecessary re-renders from minor fluctuations. The value '1' was chosen
// because fadeProgress is typically reported as an integer percentage (0-100).
const FADE_PROGRESS_THRESHOLD = 1;

interface UseCueListPlaybackResult {
  playbackStatus: CueListPlaybackStatus | null;
  isLoading: boolean;
  error?: Error;
}

export function useCueListPlayback(cueListId: string): UseCueListPlaybackResult {
  const [playbackStatus, setPlaybackStatus] = useState<CueListPlaybackStatus | null>(null);

  // Query initial playback status
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(GET_CUE_LIST_PLAYBACK_STATUS, {
    variables: { cueListId },
    fetchPolicy: 'cache-and-network', // Always get fresh data on mount but use cache for immediate response
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

          // Compare key fields to avoid unnecessary re-renders
          if (prevStatus.currentCueIndex === newStatus.currentCueIndex &&
              prevStatus.isPlaying === newStatus.isPlaying &&
              Math.abs((prevStatus.fadeProgress ?? 0) - (newStatus.fadeProgress ?? 0)) < FADE_PROGRESS_THRESHOLD) {
            return prevStatus; // No meaningful change, keep previous state
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

  // Set initial state from query data ONLY if we don't have subscription data yet
  useEffect(() => {
    if (queryData?.cueListPlaybackStatus && !playbackStatus) {
      setPlaybackStatus(queryData.cueListPlaybackStatus);
    }
  }, [queryData?.cueListPlaybackStatus, playbackStatus]);

  // Note: Error handling is managed through the returned error property
  // Production builds should use proper error monitoring instead of console logging

  return {
    playbackStatus,
    isLoading: queryLoading || subscriptionLoading,
    error: (queryError || subscriptionError) as Error | undefined,
  };
}