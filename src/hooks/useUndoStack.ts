import { useState, useCallback, useRef } from 'react';

/**
 * Represents a single channel value change for undo/redo
 */
export interface UndoDelta {
  fixtureId: string;
  channelIndex: number;
  previousValue: number;
  newValue: number;
}

/**
 * Represents an active channel toggle change for undo/redo
 */
export interface ActiveDelta {
  fixtureId: string;
  channelIndex: number;
  wasActive: boolean;
}

/**
 * Represents a single undoable action
 */
export interface UndoAction {
  type: 'CHANNEL_CHANGE' | 'ACTIVE_TOGGLE' | 'BATCH_CHANGE';
  timestamp: number;
  channelDeltas?: UndoDelta[];
  activeDeltas?: ActiveDelta[];
  description: string;
}

/**
 * Options for configuring the undo stack behavior
 */
export interface UseUndoStackOptions {
  /** Maximum number of undo actions to keep (default: 50) */
  maxStackSize?: number;
  /** Time window in ms for coalescing rapid changes (default: 500ms) */
  coalesceWindowMs?: number;
}

/**
 * Return type for the useUndoStack hook
 */
export interface UseUndoStackReturn {
  /** Push a new action to the undo stack */
  pushAction: (action: Omit<UndoAction, 'timestamp'>) => void;
  /** Undo the last action, returns the action to reverse */
  undo: () => UndoAction | null;
  /** Redo the last undone action, returns the action to re-apply */
  redo: () => UndoAction | null;
  /** Whether there are actions to undo */
  canUndo: boolean;
  /** Whether there are actions to redo */
  canRedo: boolean;
  /** Clear all undo/redo history */
  clearHistory: () => void;
  /** Current number of undo actions available */
  undoStackLength: number;
  /** Current number of redo actions available */
  redoStackLength: number;
}

/**
 * Custom hook for managing undo/redo functionality.
 *
 * Features:
 * - Coalesces rapid changes within a time window into a single undo action
 * - Stores deltas (not full state) for memory efficiency
 * - Limits stack size to prevent memory bloat
 * - Clears redo stack when new actions are pushed
 *
 * @example
 * ```tsx
 * const { pushAction, undo, redo, canUndo, canRedo } = useUndoStack();
 *
 * // When user changes a channel value
 * pushAction({
 *   type: 'CHANNEL_CHANGE',
 *   channelDeltas: [{
 *     fixtureId: 'fixture-1',
 *     channelIndex: 0,
 *     previousValue: 100,
 *     newValue: 200,
 *   }],
 *   description: 'Changed Dimmer',
 * });
 *
 * // When user presses Cmd+Z
 * const actionToReverse = undo();
 * if (actionToReverse?.channelDeltas) {
 *   actionToReverse.channelDeltas.forEach(delta => {
 *     setChannelValue(delta.fixtureId, delta.channelIndex, delta.previousValue);
 *   });
 * }
 * ```
 */
export function useUndoStack(options?: UseUndoStackOptions): UseUndoStackReturn {
  const maxStackSize = options?.maxStackSize ?? 50;
  const coalesceWindowMs = options?.coalesceWindowMs ?? 500;

  // Use refs for stacks to avoid re-renders on every stack change
  const undoStackRef = useRef<UndoAction[]>([]);
  const redoStackRef = useRef<UndoAction[]>([]);

  // Use state to trigger re-renders when canUndo/canRedo changes
  // The version value isn't used directly, but updating it forces re-render
  const [, setVersion] = useState(0);

  /**
   * Push a new action to the undo stack.
   * If the action is of the same type as the last action and within the coalesce window,
   * the deltas will be merged into the existing action.
   */
  const pushAction = useCallback(
    (action: Omit<UndoAction, 'timestamp'>) => {
      const now = Date.now();
      const lastAction = undoStackRef.current[undoStackRef.current.length - 1];

      // Check if we should coalesce with the last action
      if (
        lastAction &&
        lastAction.type === action.type &&
        now - lastAction.timestamp < coalesceWindowMs
      ) {
        // Merge channel deltas into existing action
        if (action.channelDeltas && lastAction.channelDeltas) {
          // For coalescing, we want to keep the original previousValue but update to new newValue
          action.channelDeltas.forEach((newDelta) => {
            const existingDelta = lastAction.channelDeltas!.find(
              (d) => d.fixtureId === newDelta.fixtureId && d.channelIndex === newDelta.channelIndex
            );
            if (existingDelta) {
              // Update the newValue but keep the original previousValue
              existingDelta.newValue = newDelta.newValue;
            } else {
              // Add new delta
              lastAction.channelDeltas!.push(newDelta);
            }
          });
        } else if (action.channelDeltas) {
          lastAction.channelDeltas = action.channelDeltas;
        }

        // Merge active deltas similarly
        if (action.activeDeltas && lastAction.activeDeltas) {
          action.activeDeltas.forEach((newDelta) => {
            const existingDelta = lastAction.activeDeltas!.find(
              (d) => d.fixtureId === newDelta.fixtureId && d.channelIndex === newDelta.channelIndex
            );
            if (!existingDelta) {
              lastAction.activeDeltas!.push(newDelta);
            }
            // For active deltas, we keep the original wasActive value
          });
        } else if (action.activeDeltas) {
          lastAction.activeDeltas = action.activeDeltas;
        }

        // Extend the coalesce window
        lastAction.timestamp = now;
        // Update description to most recent
        lastAction.description = action.description;
      } else {
        // Push new action
        const newAction: UndoAction = {
          ...action,
          timestamp: now,
        };
        undoStackRef.current.push(newAction);

        // Enforce max stack size
        if (undoStackRef.current.length > maxStackSize) {
          undoStackRef.current.shift();
        }
      }

      // Clear redo stack on new action
      redoStackRef.current = [];

      // Trigger re-render
      setVersion((v) => v + 1);
    },
    [maxStackSize, coalesceWindowMs]
  );

  /**
   * Undo the last action. Returns the action that should be reversed,
   * or null if there's nothing to undo.
   */
  const undo = useCallback(() => {
    const action = undoStackRef.current.pop();
    if (action) {
      redoStackRef.current.push(action);
      setVersion((v) => v + 1);
      return action;
    }
    return null;
  }, []);

  /**
   * Redo the last undone action. Returns the action that should be re-applied,
   * or null if there's nothing to redo.
   */
  const redo = useCallback(() => {
    const action = redoStackRef.current.pop();
    if (action) {
      undoStackRef.current.push(action);
      setVersion((v) => v + 1);
      return action;
    }
    return null;
  }, []);

  /**
   * Clear all undo and redo history.
   * Typically called after saving changes.
   */
  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setVersion((v) => v + 1);
  }, []);

  return {
    pushAction,
    undo,
    redo,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    clearHistory,
    undoStackLength: undoStackRef.current.length,
    redoStackLength: redoStackRef.current.length,
  };
}
