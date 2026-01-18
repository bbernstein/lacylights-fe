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
 * - Cmd+Shift+Z (Mac) / Ctrl+Shift+Z or Ctrl+Y (Windows/Linux): Redo
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

      // Detect macOS: prefer userAgentData (modern), fallback to userAgent (legacy)
      // navigator.platform is deprecated but some browsers may still need it as fallback
      const isMac = (() => {
        // Modern approach using userAgentData (Chrome 90+, Edge 90+)
        if (typeof navigator !== 'undefined' && 'userAgentData' in navigator) {
          const uaData = navigator.userAgentData as { platform?: string } | undefined;
          if (uaData?.platform) {
            return uaData.platform.toLowerCase().includes('mac');
          }
        }
        // Fallback to userAgent for broader browser support
        if (typeof navigator !== 'undefined' && navigator.userAgent) {
          return /macintosh|mac os x/i.test(navigator.userAgent);
        }
        return false;
      })();
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      if (!modifierKey) {
        return;
      }

      // Redo: Cmd+Shift+Z (Mac) or Ctrl+Shift+Z or Ctrl+Y (Windows/Linux)
      // Note: event.key is uppercase 'Z' when Shift is pressed, so we use toLowerCase()
      if (
        (event.shiftKey && event.key.toLowerCase() === 'z') ||
        (!isMac && event.key === 'y')
      ) {
        // Always prevent default to avoid browser's native redo behavior
        event.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }

      // Undo: Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        // Always prevent default to avoid browser's native undo behavior
        event.preventDefault();
        if (canUndo) {
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
