'use client';

import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

/**
 * Props for the LookEditorBottomActions component
 */
interface LookEditorBottomActionsProps {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Whether preview mode is active */
  previewMode: boolean;
  /** Current save status */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  /** Called when save button is pressed */
  onSave: () => void;
  /** Called when undo button is pressed */
  onUndo: () => void;
  /** Called when redo button is pressed */
  onRedo: () => void;
  /** Called when preview toggle is pressed */
  onTogglePreview: () => void;
  /** Test ID for the component */
  testId?: string;
}

/**
 * Fixed bottom action bar for Look Editor on mobile
 *
 * Displays primary actions at the bottom of the screen:
 * - Save button (with status indicator)
 * - Preview toggle
 * - Undo/Redo buttons
 *
 * Only visible on mobile screens (md:hidden).
 *
 * @example
 * ```tsx
 * <LookEditorBottomActions
 *   isDirty={isDirty}
 *   canUndo={canUndo}
 *   canRedo={canRedo}
 *   previewMode={previewMode}
 *   saveStatus={saveStatus}
 *   onSave={handleSave}
 *   onUndo={handleUndo}
 *   onRedo={handleRedo}
 *   onTogglePreview={handleTogglePreview}
 * />
 * ```
 */
export default function LookEditorBottomActions({
  isDirty,
  canUndo,
  canRedo,
  previewMode,
  saveStatus,
  onSave,
  onUndo,
  onRedo,
  onTogglePreview,
  testId = 'look-editor-bottom-actions',
}: LookEditorBottomActionsProps) {
  return (
    <div
      className="fixed bottom-16 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-3 md:hidden z-40"
      data-testid={testId}
    >
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Undo/Redo group */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
            aria-label="Undo"
            title="Undo"
            data-testid={`${testId}-undo-button`}
          >
            <ArrowUturnLeftIcon className="h-6 w-6" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
            aria-label="Redo"
            title="Redo"
            data-testid={`${testId}-redo-button`}
          >
            <ArrowUturnRightIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Preview toggle */}
        <button
          onClick={onTogglePreview}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors touch-manipulation ${
            previewMode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
          }`}
          aria-label={previewMode ? 'Disable preview' : 'Enable preview'}
          aria-pressed={previewMode}
          data-testid={`${testId}-preview-button`}
        >
          {previewMode ? (
            <EyeIcon className="h-5 w-5" />
          ) : (
            <EyeSlashIcon className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">Preview</span>
        </button>

        {/* Save button with status */}
        <button
          onClick={onSave}
          disabled={!isDirty || saveStatus === 'saving'}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors touch-manipulation ${
            isDirty
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Save changes"
          data-testid={`${testId}-save-button`}
        >
          {saveStatus === 'saving' ? (
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
          ) : saveStatus === 'saved' ? (
            <CheckIcon className="h-5 w-5 text-green-400" />
          ) : saveStatus === 'error' ? (
            <XMarkIcon className="h-5 w-5 text-red-400" />
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          )}
          <span className="text-sm font-medium">
            {saveStatus === 'saving'
              ? 'Saving'
              : saveStatus === 'saved'
                ? 'Saved'
                : saveStatus === 'error'
                  ? 'Error'
                  : 'Save'}
          </span>
        </button>
      </div>
    </div>
  );
}
