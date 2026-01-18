'use client';

import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { XMarkIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { GET_OPERATION_HISTORY, JUMP_TO_OPERATION, CLEAR_OPERATION_HISTORY } from '@/graphql/undoRedo';
import {
  GetOperationHistoryQuery,
  JumpToOperationMutation,
  ClearOperationHistoryMutation,
  OperationType,
  UndoEntityType,
} from '@/generated/graphql';
import { useProject } from '@/contexts/ProjectContext';

interface OperationHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Formats an operation type for display.
 */
function formatOperationType(type: OperationType): string {
  switch (type) {
    case OperationType.Create:
      return 'Created';
    case OperationType.Update:
      return 'Updated';
    case OperationType.Delete:
      return 'Deleted';
    case OperationType.Bulk:
      return 'Bulk';
    default:
      return type;
  }
}

/**
 * Formats an entity type for display.
 */
function formatEntityType(type: UndoEntityType): string {
  switch (type) {
    case UndoEntityType.Look:
      return 'Look';
    case UndoEntityType.FixtureInstance:
      return 'Fixture';
    case UndoEntityType.Cue:
      return 'Cue';
    case UndoEntityType.CueList:
      return 'Cue List';
    case UndoEntityType.LookBoard:
      return 'Look Board';
    case UndoEntityType.LookBoardButton:
      return 'Button';
    case UndoEntityType.Effect:
      return 'Effect';
    case UndoEntityType.Project:
      return 'Project';
    default:
      return type;
  }
}

/**
 * Formats a timestamp for display.
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than a minute ago
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than an hour ago
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than a day ago
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // More than a day ago
  return date.toLocaleDateString();
}

/**
 * A slide-out panel component that displays the operation history.
 */
export function OperationHistoryPanel({ isOpen, onClose }: OperationHistoryPanelProps) {
  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  const { data, loading, refetch } = useQuery<GetOperationHistoryQuery>(
    GET_OPERATION_HISTORY,
    {
      variables: { projectId: projectId || '', page: 1, perPage: 50 },
      skip: !projectId || !isOpen,
      fetchPolicy: 'cache-and-network',
    }
  );

  const [jumpToOperation, { loading: jumpLoading }] = useMutation<JumpToOperationMutation>(
    JUMP_TO_OPERATION
  );

  const [clearHistory, { loading: clearLoading }] = useMutation<ClearOperationHistoryMutation>(
    CLEAR_OPERATION_HISTORY
  );

  // Refetch when panel opens
  useEffect(() => {
    if (isOpen && projectId) {
      refetch();
    }
  }, [isOpen, projectId, refetch]);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleJumpToOperation = async (operationId: string) => {
    if (!projectId || jumpLoading) return;

    try {
      await jumpToOperation({
        variables: { projectId, operationId },
      });
      refetch();
    } catch (error) {
      console.error('Failed to jump to operation:', error);
    }
  };

  const handleClearHistory = async () => {
    if (!projectId || clearLoading) return;

    const confirmed = window.confirm(
      'Are you sure you want to clear the operation history? This action cannot be undone.'
    );

    if (confirmed) {
      try {
        await clearHistory({
          variables: { projectId, confirmClear: true },
        });
        refetch();
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  const operations = data?.operationHistory?.operations || [];
  const currentSequence = data?.operationHistory?.currentSequence ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/30 z-40 transition-opacity
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800
          shadow-xl z-50 transform transition-transform
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              History
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              disabled={clearLoading || operations.length === 0}
              className={`
                p-1.5 rounded-md transition-colors
                ${operations.length > 0 && !clearLoading
                  ? 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-300 cursor-not-allowed dark:text-gray-600'
                }
              `}
              title="Clear history"
              aria-label="Clear history"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : operations.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No history yet</p>
              <p className="text-sm mt-1">Changes will appear here</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {operations.map((operation) => {
                const isCurrent = operation.isCurrent;
                const isInFuture = operation.sequence > currentSequence;

                return (
                  <li key={operation.id}>
                    <button
                      onClick={() => handleJumpToOperation(operation.id)}
                      disabled={jumpLoading || isCurrent}
                      className={`
                        w-full text-left p-3 rounded-lg transition-colors
                        ${isCurrent
                          ? 'bg-blue-50 border-2 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                          : isInFuture
                            ? 'bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-500 dark:hover:bg-gray-700'
                            : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700'
                        }
                        ${jumpLoading ? 'opacity-50 cursor-wait' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`
                            font-medium truncate
                            ${isCurrent
                              ? 'text-blue-700 dark:text-blue-300'
                              : isInFuture
                                ? 'text-gray-400 dark:text-gray-500'
                                : 'text-gray-900 dark:text-white'
                            }
                          `}>
                            {operation.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className={`
                              px-1.5 py-0.5 rounded
                              ${isInFuture
                                ? 'bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                              }
                            `}>
                              {formatOperationType(operation.operationType)}
                            </span>
                            <span className={isInFuture ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}>
                              {formatEntityType(operation.entityType)}
                            </span>
                          </div>
                        </div>
                        <span className={`
                          text-xs whitespace-nowrap ml-2
                          ${isInFuture ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}
                        `}>
                          {formatTimestamp(operation.createdAt)}
                        </span>
                      </div>
                      {isCurrent && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Current state
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default OperationHistoryPanel;
