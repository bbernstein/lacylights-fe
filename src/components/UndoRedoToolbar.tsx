'use client';

import React from 'react';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline';
import { useUndoRedo } from '@/contexts/UndoRedoContext';

interface UndoRedoToolbarProps {
  className?: string;
}

/**
 * A toolbar component that provides undo and redo buttons.
 * Uses the UndoRedoContext for state and actions.
 */
export function UndoRedoToolbar({ className = '' }: UndoRedoToolbarProps) {
  const {
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    undo,
    redo,
    isLoading,
  } = useUndoRedo();

  const handleUndo = async () => {
    if (canUndo && !isLoading) {
      await undo();
    }
  };

  const handleRedo = async () => {
    if (canRedo && !isLoading) {
      await redo();
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={handleUndo}
        disabled={!canUndo || isLoading}
        className={`
          p-2 rounded-md transition-colors
          ${canUndo && !isLoading
            ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            : 'text-gray-300 cursor-not-allowed dark:text-gray-600'
          }
        `}
        title={undoDescription ? `Undo: ${undoDescription}` : 'Undo'}
        aria-label={undoDescription ? `Undo: ${undoDescription}` : 'Undo'}
      >
        <ArrowUturnLeftIcon className="h-5 w-5" />
      </button>

      <button
        onClick={handleRedo}
        disabled={!canRedo || isLoading}
        className={`
          p-2 rounded-md transition-colors
          ${canRedo && !isLoading
            ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            : 'text-gray-300 cursor-not-allowed dark:text-gray-600'
          }
        `}
        title={redoDescription ? `Redo: ${redoDescription}` : 'Redo'}
        aria-label={redoDescription ? `Redo: ${redoDescription}` : 'Redo'}
      >
        <ArrowUturnRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export default UndoRedoToolbar;
