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

    // Refetch the look data to get the latest fixture positions
    // Use client.query with network-only policy to force a fresh fetch
    if (lookId) {
      client.query({
        query: GET_LOOK,
        variables: { id: lookId },
        fetchPolicy: 'network-only',
      }).catch((error) => {
        // Log error but don't throw - the subscription will continue and retry on next change
        console.error('Failed to refetch look data for fixture updates:', error);
      });
    }

    // Call the optional callback
    onDataChange?.(changeType, fixtureIds);
  }, [client, lookId, onDataChange]);

  useSubscription(FIXTURE_DATA_CHANGED_SUBSCRIPTION, {
    variables: { projectId },
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
