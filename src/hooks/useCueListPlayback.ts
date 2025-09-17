import { useSubscription } from '@apollo/client';
import { useEffect, useState } from 'react';
import { CUE_LIST_PLAYBACK_SUBSCRIPTION } from '../graphql/cueLists';
import { CueListPlaybackStatus } from '../types';

interface UseCueListPlaybackResult {
  playbackStatus: CueListPlaybackStatus | null;
  isLoading: boolean;
  error?: Error;
}

export function useCueListPlayback(cueListId?: string): UseCueListPlaybackResult {
  const [playbackStatus, setPlaybackStatus] = useState<CueListPlaybackStatus | null>(null);

  const { loading, error } = useSubscription(CUE_LIST_PLAYBACK_SUBSCRIPTION, {
    variables: { cueListId },
    skip: !cueListId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.cueListPlaybackUpdated) {
        setPlaybackStatus(subscriptionData.data.cueListPlaybackUpdated);
      }
    },
  });

  // Clear status when cueListId changes
  useEffect(() => {
    if (!cueListId) {
      setPlaybackStatus(null);
    }
  }, [cueListId]);

  return {
    playbackStatus,
    isLoading: loading,
    error: error as Error | undefined,
  };
}