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

  // Helper function to check if scene update is needed
  const shouldUpdateScene = (newScene: CurrentActiveScene | null, currentScene: CurrentActiveScene | null): boolean => {
    return newScene?.id !== currentScene?.id;
  };

  // Query initial active scene
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(GET_CURRENT_ACTIVE_SCENE, {
    fetchPolicy: 'cache-and-network', // Returns cached data if available and always makes a network request to update the data
  });

  // Subscribe to real-time updates
  const { error: subscriptionError } = useSubscription(CURRENT_ACTIVE_SCENE_UPDATED, {
    onData: ({ data: subscriptionData }) => {
      const newActiveScene = subscriptionData?.data?.currentActiveSceneUpdated;
      if (newActiveScene) {
        // Only update state if the scene has actually changed to prevent unnecessary re-renders
        setCurrentActiveScene(prevScene => {
          if (shouldUpdateScene(newActiveScene, prevScene)) {
            return newActiveScene;
          }
          return prevScene;
        });
      }
    },
  });

  // Set initial state from query data or update if query returns different data
  useEffect(() => {
    const queryScene = queryData?.currentActiveScene;
    if (queryScene && shouldUpdateScene(queryScene, currentActiveScene)) {
      setCurrentActiveScene(queryScene);
    }
  }, [queryData]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    currentActiveScene,
    isLoading: queryLoading,
    error: (queryError || subscriptionError) as Error | undefined,
  };
}