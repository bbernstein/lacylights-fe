'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_UNDO_REDO_STATUS,
  UNDO,
  REDO,
  OPERATION_HISTORY_CHANGED,
} from '@/graphql/undoRedo';
import {
  GetUndoRedoStatusQuery,
  UndoMutation,
  RedoMutation,
  OperationHistoryChangedSubscription,
} from '@/generated/graphql';
import { useProject } from './ProjectContext';

interface UndoRedoContextValue {
  // Status
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
  currentSequence: number;
  totalOperations: number;

  // Loading state
  isLoading: boolean;

  // Actions
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;

  // Last operation result
  lastMessage: string | null;
}

const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

interface UndoRedoProviderProps {
  children: ReactNode;
}

export function UndoRedoProvider({ children }: UndoRedoProviderProps) {
  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  // Query undo/redo status
  const { data, loading: queryLoading } = useQuery<GetUndoRedoStatusQuery>(
    GET_UNDO_REDO_STATUS,
    {
      variables: { projectId: projectId || '' },
      skip: !projectId,
      fetchPolicy: 'cache-and-network',
    }
  );

  // Subscribe to real-time updates
  useSubscription<OperationHistoryChangedSubscription>(
    OPERATION_HISTORY_CHANGED,
    {
      variables: { projectId: projectId || '' },
      skip: !projectId,
      onData: ({ client, data: subscriptionData }) => {
        if (subscriptionData?.data?.operationHistoryChanged && projectId) {
          // Update the cache with the new status
          client.cache.writeQuery({
            query: GET_UNDO_REDO_STATUS,
            variables: { projectId },
            data: {
              undoRedoStatus: subscriptionData.data.operationHistoryChanged,
            },
          });
        }
      },
    }
  );

  // Undo mutation - uses refetchQueries as function to ensure projectId is current
  const [undoMutation, { loading: undoLoading }] = useMutation<UndoMutation>(UNDO, {
    refetchQueries: (result) => {
      // Get projectId from mutation result for reliable refetching
      const pid = result.data?.undo?.operation?.projectId ?? projectId;
      if (!pid) return [];
      return [{ query: GET_UNDO_REDO_STATUS, variables: { projectId: pid } }];
    },
  });

  // Redo mutation - uses refetchQueries as function to ensure projectId is current
  const [redoMutation, { loading: redoLoading }] = useMutation<RedoMutation>(REDO, {
    refetchQueries: (result) => {
      // Get projectId from mutation result for reliable refetching
      const pid = result.data?.redo?.operation?.projectId ?? projectId;
      if (!pid) return [];
      return [{ query: GET_UNDO_REDO_STATUS, variables: { projectId: pid } }];
    },
  });

  // Track last operation message
  const [lastMessage, setLastMessage] = React.useState<string | null>(null);

  // Undo action
  const undo = useCallback(async (): Promise<boolean> => {
    if (!projectId) {
      setLastMessage('No project selected');
      return false;
    }

    try {
      const result = await undoMutation({
        variables: { projectId },
      });

      const undoResult = result.data?.undo;
      if (undoResult?.message) {
        setLastMessage(undoResult.message);
      }

      return undoResult?.success ?? false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Undo failed';
      setLastMessage(errorMessage);
      return false;
    }
  }, [projectId, undoMutation]);

  // Redo action
  const redo = useCallback(async (): Promise<boolean> => {
    if (!projectId) {
      setLastMessage('No project selected');
      return false;
    }

    try {
      const result = await redoMutation({
        variables: { projectId },
      });

      const redoResult = result.data?.redo;
      if (redoResult?.message) {
        setLastMessage(redoResult.message);
      }

      return redoResult?.success ?? false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Redo failed';
      setLastMessage(errorMessage);
      return false;
    }
  }, [projectId, redoMutation]);

  // Memoize the context value
  const value = useMemo<UndoRedoContextValue>(() => {
    const status = data?.undoRedoStatus;
    return {
      canUndo: status?.canUndo ?? false,
      canRedo: status?.canRedo ?? false,
      undoDescription: status?.undoDescription ?? null,
      redoDescription: status?.redoDescription ?? null,
      currentSequence: status?.currentSequence ?? 0,
      totalOperations: status?.totalOperations ?? 0,
      isLoading: queryLoading || undoLoading || redoLoading,
      undo,
      redo,
      lastMessage,
    };
  }, [data, queryLoading, undoLoading, redoLoading, undo, redo, lastMessage]);

  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  );
}

/**
 * Hook to access undo/redo functionality.
 * Must be used within an UndoRedoProvider.
 */
export function useUndoRedo(): UndoRedoContextValue {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider');
  }
  return context;
}
