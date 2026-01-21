import { useSubscription, useApolloClient } from '@apollo/client';
import { useCallback } from 'react';
import { LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION } from '../graphql/entitySubscriptions';
import { GET_LOOK_BOARD } from '../graphql/lookBoards';
import { EntityDataChangeType, LookBoardDataChangedPayload } from '../types';

interface UseLookBoardDataUpdatesOptions {
  /** Look board ID to monitor for changes */
  lookBoardId: string;
  /** Project ID for the subscription filter */
  projectId: string;
  /** Optional callback when data changes (useful for showing notifications) */
  onDataChange?: (changeType: EntityDataChangeType, affectedButtonIds?: string[]) => void;
}

/**
 * Hook to subscribe to real-time look board data changes.
 * When a change is detected (via undo/redo), it triggers a refetch of the look board data.
 */
export function useLookBoardDataUpdates({
  lookBoardId,
  projectId,
  onDataChange
}: UseLookBoardDataUpdatesOptions): void {
  const client = useApolloClient();

  const handleUpdate = useCallback((payload: LookBoardDataChangedPayload) => {
    const { changeType, lookBoardId: changedBoardId, affectedButtonIds } = payload;

    // Only refetch if this is our look board
    if (changedBoardId !== lookBoardId) {
      return;
    }

    // Refetch the look board data to get the latest state
    // Use client.query with network-only policy to force a fresh fetch
    client.query({
      query: GET_LOOK_BOARD,
      variables: { id: lookBoardId },
      fetchPolicy: 'network-only',
    }).catch((error) => {
      // Log error but don't throw - the subscription will continue and retry on next change
      console.error('Failed to refetch look board data:', error);
    });

    // Call the optional callback
    onDataChange?.(changeType, affectedButtonIds ?? undefined);
  }, [client, lookBoardId, onDataChange]);

  useSubscription(LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION, {
    variables: { projectId },
    shouldResubscribe: true,
    onData: ({ data }) => {
      if (data?.data?.lookBoardDataChanged) {
        handleUpdate(data.data.lookBoardDataChanged);
      }
    },
    onError: (error) => {
      // Log subscription errors for debugging - the subscription will auto-reconnect
      // due to shouldResubscribe: true
      console.error('Look board data subscription error:', error);
    },
  });
}
