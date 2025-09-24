import { useQuery, useSubscription } from '@apollo/client';
import { useState, useEffect } from 'react';
import { GET_CURRENT_ACTIVE_SCENE, CURRENT_ACTIVE_SCENE_UPDATED } from '../graphql/scenes';

interface CurrentActiveScene {
  id: string;
}

interface UseCurrentActiveSceneResult {
  currentActiveScene: CurrentActiveScene | null;
  isLoading: boolean;
  error?: Error;
}

export function useCurrentActiveScene(): UseCurrentActiveSceneResult {
  const [currentActiveScene, setCurrentActiveScene] = useState<CurrentActiveScene | null>(null);

  // Query initial active scene
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(GET_CURRENT_ACTIVE_SCENE, {
    fetchPolicy: 'cache-and-network', // Always get fresh data on mount but use cache for immediate response
  });

  // Subscribe to real-time updates
  const { loading: subscriptionLoading, error: subscriptionError } = useSubscription(CURRENT_ACTIVE_SCENE_UPDATED, {
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.currentActiveSceneUpdated) {
        const newActiveScene = subscriptionData.data.currentActiveSceneUpdated;
        setCurrentActiveScene(newActiveScene);
      }
    },
  });

  // Set initial state from query data ONLY if we don't have subscription data yet
  useEffect(() => {
    if (queryData?.currentActiveScene && !currentActiveScene) {
      setCurrentActiveScene(queryData.currentActiveScene);
    }
  }, [queryData, currentActiveScene]);

  return {
    currentActiveScene,
    isLoading: queryLoading || subscriptionLoading,
    error: (queryError || subscriptionError) as Error | undefined,
  };
}