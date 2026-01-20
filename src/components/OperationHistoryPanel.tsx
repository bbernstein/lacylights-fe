'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { XMarkIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { GET_OPERATION_HISTORY, JUMP_TO_OPERATION, CLEAR_OPERATION_HISTORY } from '@/graphql/undoRedo';
import {
  GetOperationHistoryQuery,
  JumpToOperationMutation,
  ClearOperationHistoryMutation,
} from '@/generated/graphql';
import { useProject } from '@/contexts/ProjectContext';
import BottomSheet from './BottomSheet';

interface OperationHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
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

  // State for confirmation modal and error toast
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-dismiss error toast after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

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

  // Extract operations early so handlers can reference it
  const operations = data?.operationHistory?.operations || [];
  const currentSequence = data?.operationHistory?.currentSequence ?? 0;

  const handleJumpToOperation = useCallback(async (operationId: string) => {
    if (!projectId || jumpLoading) return;

    try {
      await jumpToOperation({
        variables: { projectId, operationId },
      });
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to jump to operation';
      setErrorMessage(message);
      console.error('Failed to jump to operation:', error);
    }
  }, [projectId, jumpLoading, jumpToOperation, refetch]);

  // Handler to show confirmation modal
  const handleClearHistoryClick = useCallback(() => {
    if (!projectId || clearLoading || operations.length === 0) return;
    setShowClearConfirm(true);
  }, [projectId, clearLoading, operations.length]);

  // Handler to actually clear history after confirmation
  const handleConfirmClearHistory = useCallback(async () => {
    if (!projectId || clearLoading) return;

    try {
      await clearHistory({
        variables: { projectId, confirmClear: true },
      });
      refetch();
      setShowClearConfirm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear history';
      setErrorMessage(message);
      setShowClearConfirm(false);
      console.error('Failed to clear history:', error);
    }
  }, [projectId, clearLoading, clearHistory, refetch]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/30 z-40 transition-opacity
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClose();
          }
        }}
        role="button"
        aria-label="Close history panel"
        tabIndex={isOpen ? 0 : -1}
      />

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800
          shadow-xl z-50 transform transition-transform flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        role="complementary"
        aria-label="Operation history panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              History
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistoryClick}
              disabled={clearLoading || operations.length === 0}
              className={`
                p-1 rounded transition-colors
                ${operations.length > 0 && !clearLoading
                  ? 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-300 cursor-not-allowed dark:text-gray-600'
                }
              `}
              title="Clear history"
              aria-label="Clear history"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {loading ? (
            <div
              className="flex items-center justify-center h-32"
              role="status"
              aria-label="Loading history"
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
          ) : operations.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-6">
              <ClockIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No history yet</p>
              <p className="text-xs mt-1">Changes will appear here</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {operations.map((operation) => {
                const isInFuture = operation.sequence > currentSequence;

                return (
                  <li key={operation.id}>
                    <button
                      onClick={() => handleJumpToOperation(operation.id)}
                      disabled={jumpLoading || operation.isCurrent}
                      className={`
                        w-full text-left px-2 py-1.5 rounded transition-colors
                        ${operation.isCurrent
                          ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                          : isInFuture
                            ? 'bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-500 dark:hover:bg-gray-700'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                        ${jumpLoading ? 'opacity-50 cursor-wait' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`
                          text-xs leading-snug
                          ${operation.isCurrent
                            ? 'text-blue-700 dark:text-blue-300 font-medium'
                            : isInFuture
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-gray-900 dark:text-white'
                          }
                        `}>
                          {operation.isCurrent && <span className="text-blue-500 mr-1">▸</span>}
                          {operation.description}
                        </span>
                        <span className={`
                          text-[10px] whitespace-nowrap shrink-0 mt-0.5
                          ${isInFuture ? 'text-gray-400 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}
                        `}>
                          {formatTimestamp(operation.createdAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Clear History Confirmation Modal */}
      <BottomSheet
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear History"
        maxWidth="max-w-md"
        testId="clear-history-modal"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowClearConfirm(false)}
              disabled={clearLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                         rounded-md disabled:opacity-50 transition-colors"
              data-testid="clear-history-cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClearHistory}
              disabled={clearLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600
                         hover:bg-red-700 rounded-md disabled:opacity-50
                         transition-colors flex items-center gap-2"
              data-testid="clear-history-confirm"
            >
              {clearLoading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {clearLoading ? 'Clearing...' : 'Clear History'}
            </button>
          </div>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to clear the operation history? This action cannot be undone.
        </p>
      </BottomSheet>

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-[60] max-w-md">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-start">
            <svg
              className="w-6 h-6 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium">Error</h4>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-4 text-white hover:text-gray-200"
              aria-label="Dismiss error"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default OperationHistoryPanel;
