import { useQuery } from '@apollo/client';
import { useState, useEffect } from 'react';
import { GET_CURRENT_ACTIVE_LOOK } from '../graphql/looks';

interface CurrentActiveLook {
  id: string;
}

interface UseCurrentActiveLookResult {
  currentActiveLook: CurrentActiveLook | null;
  isLoading: boolean;
  error?: Error;
}

export function useCurrentActiveLook(): UseCurrentActiveLookResult {
  const [currentActiveLook, setCurrentActiveLook] = useState<CurrentActiveLook | null>(null);

  // Helper function to check if look update is needed
  const shouldUpdateLook = (newLook: CurrentActiveLook | null, currentLook: CurrentActiveLook | null): boolean => {
    return newLook?.id !== currentLook?.id;
  };

  // Query active look with polling for updates
  // Note: The backend doesn't have a currentActiveLookUpdated subscription,
  // so we use polling to check for changes every 2 seconds
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(GET_CURRENT_ACTIVE_LOOK, {
    fetchPolicy: 'cache-and-network', // Returns cached data if available and always makes a network request to update the data
    pollInterval: 2000, // Poll every 2 seconds for active look changes
  });

  // Set initial state from query data or update if query returns different data
  useEffect(() => {
    const queryLook = queryData?.currentActiveLook;
    if (queryLook && shouldUpdateLook(queryLook, currentActiveLook)) {
      setCurrentActiveLook(queryLook);
    }
  }, [queryData]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    currentActiveLook,
    isLoading: queryLoading,
    error: queryError as Error | undefined,
  };
}
