import { useSubscription, useApolloClient } from '@apollo/client';
import { useCallback } from 'react';
import { FIXTURE_DATA_CHANGED_SUBSCRIPTION } from '../graphql/entitySubscriptions';
import { GET_LOOK } from '../graphql/looks';
import { EntityDataChangeType, FixtureDataChangedPayload } from '../types';

interface UseFixtureDataUpdatesOptions {
  projectId: string;
  /** Optional look ID to refetch when fixtures change */
  lookId?: string;
  /** Optional callback when data changes (useful for showing notifications) */
  onDataChange?: (changeType: EntityDataChangeType, fixtureIds: string[]) => void;
}

/**
 * Hook to subscribe to real-time fixture data changes.
 * When a change is detected (via position updates or undo/redo), it triggers a refetch
 * of the look data to update the 2D Layout view.
 */
export function useFixtureDataUpdates({ projectId, lookId, onDataChange }: UseFixtureDataUpdatesOptions): void {
  const client = useApolloClient();

  const handleUpdate = useCallback((payload: FixtureDataChangedPayload) => {
    const { changeType, fixtureIds } = payload;

    // Refetch the look data to get the latest fixture positions when lookId is provided.
    // Use network-only fetchPolicy to bypass Apollo cache and get fresh server data.
    // This is intentional for undo/redo operations where we need the authoritative state.
    if (lookId) {
      client.query({
        query: GET_LOOK,
        variables: { id: lookId },
        fetchPolicy: 'network-only',
      }).then(() => {
        // Call the optional callback after successful refetch
        onDataChange?.(changeType, fixtureIds);
      }).catch((error) => {
        // Log error but don't throw - the subscription will continue and retry on next change
        console.error('Failed to refetch look data for fixture updates:', error);
        // Still call the callback on error so consumers know a change occurred
        onDataChange?.(changeType, fixtureIds);
      });
    } else {
      // No lookId provided, just notify via callback immediately
      onDataChange?.(changeType, fixtureIds);
    }
  }, [client, lookId, onDataChange]);

  useSubscription(FIXTURE_DATA_CHANGED_SUBSCRIPTION, {
    variables: { projectId },
    // Skip subscription when projectId is empty to avoid unnecessary WebSocket connections
    skip: !projectId,
    shouldResubscribe: true,
    onData: ({ data }) => {
      if (data?.data?.fixtureDataChanged) {
        handleUpdate(data.data.fixtureDataChanged);
      }
    },
    onError: (error) => {
      // Log subscription errors for debugging - the subscription will auto-reconnect
      // due to shouldResubscribe: true
      console.error('Fixture data subscription error:', error);
    },
  });
}
