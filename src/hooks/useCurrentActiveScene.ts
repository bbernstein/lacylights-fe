import { useQuery } from '@apollo/client';
import { useState, useEffect } from 'react';
import { GET_CURRENT_ACTIVE_SCENE } from '../graphql/scenes';

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

  // Query active scene with polling for updates
  // Note: The backend doesn't have a currentActiveSceneUpdated subscription,
  // so we use polling to check for changes every 2 seconds
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(GET_CURRENT_ACTIVE_SCENE, {
    fetchPolicy: 'cache-and-network', // Returns cached data if available and always makes a network request to update the data
    pollInterval: 2000, // Poll every 2 seconds for active scene changes
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
    error: queryError as Error | undefined,
  };
}