import { useSubscription, useApolloClient } from '@apollo/client';
import { useCallback } from 'react';
import { CUE_LIST_DATA_CHANGED_SUBSCRIPTION, GET_CUE_LIST } from '../graphql/cueLists';
import { CueListDataChangeType, CueListDataChangedPayload } from '../types';

interface UseCueListDataUpdatesOptions {
  cueListId: string;
  /** Optional callback when data changes (useful for showing notifications) */
  onDataChange?: (changeType: CueListDataChangeType) => void;
}

/**
 * Hook to subscribe to real-time cue list data changes.
 * When a change is detected, it triggers a refetch of the cue list data.
 */
export function useCueListDataUpdates({ cueListId, onDataChange }: UseCueListDataUpdatesOptions): void {
  const client = useApolloClient();

  const handleUpdate = useCallback((payload: CueListDataChangedPayload) => {
    const { changeType } = payload;

    // Refetch the cue list data to get the latest state
    // Use client.query with network-only policy to force a fresh fetch with variables
    client.query({
      query: GET_CUE_LIST,
      variables: { id: cueListId },
      fetchPolicy: 'network-only',
    });

    // Call the optional callback
    onDataChange?.(changeType);
  }, [client, cueListId, onDataChange]);

  useSubscription(CUE_LIST_DATA_CHANGED_SUBSCRIPTION, {
    variables: { cueListId },
    shouldResubscribe: true,
    onData: ({ data }) => {
      if (data?.data?.cueListDataChanged) {
        handleUpdate(data.data.cueListDataChanged);
      }
    },
  });
}
