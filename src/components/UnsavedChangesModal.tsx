import { useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Props for the UnsavedChangesModal component
 */
interface UnsavedChangesModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when user clicks Save */
  onSave: () => void;
  /** Called when user clicks Discard */
  onDiscard: () => void;
  /** Called when user clicks Cancel or presses Escape */
  onCancel: () => void;
  /** Whether a save operation is in progress */
  saveInProgress?: boolean;
  /** Custom message to display (optional) */
  message?: string;
  /** Title for the modal (optional) */
  title?: string;
}

/**
 * Modal dialog for prompting user about unsaved changes.
 *
 * Provides three options:
 * - Save: Save changes and proceed
 * - Discard: Discard changes and proceed
 * - Cancel: Stay and keep editing
 *
 * @example
 * ```tsx
 * <UnsavedChangesModal
 *   isOpen={showUnsavedModal}
 *   onSave={handleSaveAndClose}
 *   onDiscard={handleDiscardAndClose}
 *   onCancel={() => setShowUnsavedModal(false)}
 *   saveInProgress={isSaving}
 * />
 * ```
 */
export default function UnsavedChangesModal({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  saveInProgress = false,
  message = 'You have unsaved changes. What would you like to do?',
  title = 'Unsaved Changes',
}: UnsavedChangesModalProps) {
  // Handle escape key to cancel
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saveInProgress) {
        onCancel();
      }
    },
    [onCancel, saveInProgress]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click to cancel
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !saveInProgress) {
        onCancel();
      }
    },
    [onCancel, saveInProgress]
  );

  if (!isOpen) return null;

  return (
    // Modal overlay - z-50 to be above other content
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      data-testid="unsaved-changes-modal-backdrop"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="unsaved-changes-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            disabled={saveInProgress}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>

        {/* Footer with actions */}
        <div className="flex justify-end space-x-3 px-6 pb-6">
          <button
            onClick={onDiscard}
            disabled={saveInProgress}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700
                       dark:text-red-400 dark:hover:text-red-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            data-testid="unsaved-changes-discard-button"
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            disabled={saveInProgress}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                       rounded-md disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            data-testid="unsaved-changes-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saveInProgress}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600
                       hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center space-x-2"
            data-testid="unsaved-changes-save-button"
          >
            {saveInProgress && (
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
            <span>{saveInProgress ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
