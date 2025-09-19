import { useSubscription } from '@apollo/client';
import { useState } from 'react';
import { CUE_LIST_PLAYBACK_SUBSCRIPTION } from '../graphql/cueLists';
import { CueListPlaybackStatus } from '../types';

interface UseCueListPlaybackResult {
  playbackStatus: CueListPlaybackStatus | null;
  isLoading: boolean;
  error?: Error;
}

export function useCueListPlayback(cueListId: string): UseCueListPlaybackResult {
  const [playbackStatus, setPlaybackStatus] = useState<CueListPlaybackStatus | null>(null);

  const { loading, error } = useSubscription(CUE_LIST_PLAYBACK_SUBSCRIPTION, {
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

  return {
    playbackStatus,
    isLoading: loading,
    error: error as Error | undefined,
  };
}