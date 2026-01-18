'use client';

import { useEffect, useCallback } from 'react';
import { useUndoRedo } from '@/contexts/UndoRedoContext';

/**
 * Tags that should not trigger undo/redo when focused.
 * These are typically input elements where the user might be typing.
 */
const IGNORED_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

/**
 * Hook that listens for keyboard shortcuts to trigger undo/redo.
 *
 * Shortcuts:
 * - Cmd+Z (Mac) / Ctrl+Z (Windows/Linux): Undo
 * - Cmd+Shift+Z (Mac) / Ctrl+Y (Windows/Linux): Redo
 *
 * Shortcuts are ignored when:
 * - Focus is on an input, textarea, or select element
 * - Focus is on an element with contentEditable="true"
 */
export function useUndoRedoKeyboard(): void {
  const { undo, redo, canUndo, canRedo, isLoading } = useUndoRedo();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger if we're in an input field or content-editable element
      const target = event.target as HTMLElement;
      if (target && target.tagName) {
        if (IGNORED_TAGS.includes(target.tagName) || target.isContentEditable) {
          return;
        }
      }

      // Don't trigger if loading
      if (isLoading) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      if (!modifierKey) {
        return;
      }

      // Redo: Cmd+Shift+Z (Mac) or Ctrl+Shift+Z or Ctrl+Y (Windows/Linux)
      // Note: event.key is uppercase 'Z' when Shift is pressed, so we use toLowerCase()
      if (
        (isMac && event.shiftKey && event.key.toLowerCase() === 'z') ||
        (!isMac && event.shiftKey && event.key.toLowerCase() === 'z') ||
        (!isMac && event.key === 'y')
      ) {
        if (canRedo) {
          event.preventDefault();
          redo();
        }
        return;
      }

      // Undo: Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if (event.key === 'z' && !event.shiftKey) {
        if (canUndo) {
          event.preventDefault();
          undo();
        }
        return;
      }
    },
    [undo, redo, canUndo, canRedo, isLoading]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
