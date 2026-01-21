import { useSubscription, useApolloClient } from '@apollo/client';
import { useCallback } from 'react';
import { LOOK_DATA_CHANGED_SUBSCRIPTION } from '../graphql/entitySubscriptions';
import { GET_PROJECT_LOOKS } from '../graphql/looks';
import { EntityDataChangeType, LookDataChangedPayload } from '../types';

interface UseLookDataUpdatesOptions {
  projectId: string;
  /** Optional callback when data changes (useful for showing notifications) */
  onDataChange?: (changeType: EntityDataChangeType, lookId: string) => void;
}

/**
 * Hook to subscribe to real-time look data changes.
 * When a change is detected (via undo/redo), it triggers a refetch of the looks data.
 */
export function useLookDataUpdates({ projectId, onDataChange }: UseLookDataUpdatesOptions): void {
  const client = useApolloClient();

  const handleUpdate = useCallback((payload: LookDataChangedPayload) => {
    const { changeType, lookId } = payload;

    // Refetch the project looks to get the latest state
    // Use client.query with network-only policy to force a fresh fetch
    client.query({
      query: GET_PROJECT_LOOKS,
      variables: { projectId },
      fetchPolicy: 'network-only',
    }).catch((error) => {
      // Log error but don't throw - the subscription will continue and retry on next change
      console.error('Failed to refetch looks data:', error);
    });

    // Call the optional callback
    onDataChange?.(changeType, lookId);
  }, [client, projectId, onDataChange]);

  useSubscription(LOOK_DATA_CHANGED_SUBSCRIPTION, {
    variables: { projectId },
    shouldResubscribe: true,
    onData: ({ data }) => {
      if (data?.data?.lookDataChanged) {
        handleUpdate(data.data.lookDataChanged);
      }
    },
    onError: (error) => {
      // Log subscription errors for debugging - the subscription will auto-reconnect
      // due to shouldResubscribe: true
      console.error('Look data subscription error:', error);
    },
  });
}
