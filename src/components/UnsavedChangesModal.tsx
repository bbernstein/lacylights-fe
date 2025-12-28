import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

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
  const isMobile = useIsMobile();

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-end space-x-3'}`}>
      {isMobile ? (
        <>
          {/* Save button first on mobile (primary action) */}
          <button
            onClick={onSave}
            disabled={saveInProgress}
            className="w-full px-4 py-3 text-base font-medium text-white bg-blue-600
                       hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center space-x-2 min-h-[44px] touch-manipulation"
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
          {/* Cancel button second on mobile */}
          <button
            onClick={onCancel}
            disabled={saveInProgress}
            className="w-full px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300
                       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                       rounded-md disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors min-h-[44px] touch-manipulation"
            data-testid="unsaved-changes-cancel-button"
          >
            Cancel
          </button>
          {/* Discard button last on mobile (destructive) */}
          <button
            onClick={onDiscard}
            disabled={saveInProgress}
            className="w-full px-4 py-3 text-base font-medium text-red-600 hover:text-red-700
                       dark:text-red-400 dark:hover:text-red-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors min-h-[44px] touch-manipulation"
            data-testid="unsaved-changes-discard-button"
          >
            Discard
          </button>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={footerContent}
      maxWidth="max-w-md"
      closeOnBackdrop={!saveInProgress}
      closeOnEscape={!saveInProgress}
      testId="unsaved-changes-modal"
    >
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </BottomSheet>
  );
}
