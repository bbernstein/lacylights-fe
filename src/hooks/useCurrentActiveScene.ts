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
  const { error: subscriptionError } = useSubscription(CURRENT_ACTIVE_SCENE_UPDATED, {
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.currentActiveSceneUpdated) {
        const newActiveScene = subscriptionData.data.currentActiveSceneUpdated;
        // Only update state if the scene has actually changed to prevent unnecessary re-renders
        setCurrentActiveScene(prevScene => {
          if (newActiveScene?.id !== prevScene?.id) {
            return newActiveScene;
          }
          return prevScene;
        });
      }
    },
  });

  // Set initial state from query data or update if query returns different data
  useEffect(() => {
    if (
      queryData?.currentActiveScene &&
      (!currentActiveScene || queryData.currentActiveScene.id !== currentActiveScene.id)
    ) {
      setCurrentActiveScene(queryData.currentActiveScene);
    }
  }, [queryData]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    currentActiveScene,
    isLoading: queryLoading,
    error: (queryError || subscriptionError) as Error | undefined,
  };
}