import { useQuery, useSubscription } from '@apollo/client';
import { useState, useEffect } from 'react';
import { GET_CUE_LIST_PLAYBACK_STATUS, CUE_LIST_PLAYBACK_SUBSCRIPTION } from '../graphql/cueLists';
import { CueListPlaybackStatus } from '../types';

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
        setPlaybackStatus(subscriptionData.data.cueListPlaybackUpdated);
      }
    },
    // Note: Manual state reset on cueListId change is intentionally omitted
    // Apollo Client automatically handles subscription cleanup and re-subscription
    // when variables change. Manual reset creates race conditions where
    // playbackStatus becomes temporarily null even when valid data is available.
    // The subscription will naturally update with new data for the new cueListId.
  });

  // Set initial state from query data
  useEffect(() => {
    if (queryData?.cueListPlaybackStatus && queryData.cueListPlaybackStatus !== playbackStatus) {
      setPlaybackStatus(queryData.cueListPlaybackStatus);
    }
  }, [queryData, playbackStatus]);

  return {
    playbackStatus,
    isLoading: queryLoading || subscriptionLoading,
    error: (queryError || subscriptionError) as Error | undefined,
  };
}