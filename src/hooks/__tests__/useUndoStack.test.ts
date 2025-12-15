import { renderHook, act } from '@testing-library/react';
import { useUndoStack, UndoDelta } from '../useUndoStack';

describe('useUndoStack', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic push and undo', () => {
    it('should start with empty stacks', () => {
      const { result } = renderHook(() => useUndoStack());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoStackLength).toBe(0);
      expect(result.current.redoStackLength).toBe(0);
    });

    it('should push action to undo stack', () => {
      const { result } = renderHook(() => useUndoStack());

      act(() => {
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 200 },
          ],
          description: 'Changed Dimmer',
        });
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoStackLength).toBe(1);
    });

    it('should undo and return action', () => {
      const { result } = renderHook(() => useUndoStack());

      const delta: UndoDelta = {
        fixtureId: 'fixture-1',
        channelIndex: 0,
        previousValue: 100,
        newValue: 200,
      };

      act(() => {
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [delta],
          description: 'Changed Dimmer',
        });
      });

      let undoneAction: ReturnType<typeof result.current.undo>;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction).not.toBeNull();
      expect(undoneAction!.channelDeltas).toHaveLength(1);
      expect(undoneAction!.channelDeltas![0].previousValue).toBe(100);
      expect(undoneAction!.channelDeltas![0].newValue).toBe(200);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('should return null when nothing to undo', () => {
      const { result } = renderHook(() => useUndoStack());

      let undoneAction: ReturnType<typeof result.current.undo>;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction).toBeNull();
    });
  });

  describe('redo', () => {
    it('should redo after undo', () => {
      const { result } = renderHook(() => useUndoStack());

      act(() => {
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 200 },
          ],
          description: 'Changed Dimmer',
        });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      let redoneAction: ReturnType<typeof result.current.redo>;
      act(() => {
        redoneAction = result.current.redo();
      });

      expect(redoneAction).not.toBeNull();
      expect(redoneAction!.channelDeltas![0].newValue).toBe(200);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should return null when nothing to redo', () => {
      const { result } = renderHook(() => useUndoStack());

      let redoneAction: ReturnType<typeof result.current.redo>;
      act(() => {
        redoneAction = result.current.redo();
      });

      expect(redoneAction).toBeNull();
    });

    it('should clear redo stack on new action', () => {
      const { result } = renderHook(() => useUndoStack());

      act(() => {
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 200 },
          ],
          description: 'First change',
        });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Push new action - should clear redo stack
      act(() => {
        jest.advanceTimersByTime(1000); // Move past coalesce window
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 150 },
          ],
          description: 'New change',
        });
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.redoStackLength).toBe(0);
    });
  });

  describe('coalescing', () => {
    it('should coalesce rapid changes within time window', () => {
      const { result } = renderHook(() => useUndoStack({ coalesceWindowMs: 500 }));

      act(() => {
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 150 },
          ],
          description: 'Change 1',
        });
      });

      // Push another change within coalesce window
      act(() => {
        jest.advanceTimersByTime(200);
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 150, newValue: 200 },
          ],
          description: 'Change 2',
        });
      });

      // Should still be only 1 action
      expect(result.current.undoStackLength).toBe(1);

      // Undo should restore to original value
      let undoneAction: ReturnType<typeof result.current.undo>;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction!.channelDeltas![0].previousValue).toBe(100);
      expect(undoneAction!.channelDeltas![0].newValue).toBe(200);
    });

    it('should not coalesce changes after time window', () => {
      const { result } = renderHook(() => useUndoStack({ coalesceWindowMs: 500 }));

      act(() => {
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 150 },
          ],
          description: 'Change 1',
        });
      });

      // Push another change after coalesce window
      act(() => {
        jest.advanceTimersByTime(600);
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 150, newValue: 200 },
          ],
          description: 'Change 2',
        });
      });

      // Should be 2 separate actions
      expect(result.current.undoStackLength).toBe(2);
    });

    it('should not coalesce different action types', () => {
      const { result } = renderHook(() => useUndoStack({ coalesceWindowMs: 500 }));

      act(() => {
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 200 },
          ],
          description: 'Channel change',
        });
      });

      act(() => {
        jest.advanceTimersByTime(200);
        result.current.pushAction({
          type: 'ACTIVE_TOGGLE',
          activeDeltas: [{ fixtureId: 'fixture-1', channelIndex: 0, wasActive: true }],
          description: 'Toggle active',
        });
      });

      // Should be 2 separate actions
      expect(result.current.undoStackLength).toBe(2);
    });

    it('should coalesce changes to different channels', () => {
      const { result } = renderHook(() => useUndoStack({ coalesceWindowMs: 500 }));

      act(() => {
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 200 },
          ],
          description: 'Change channel 0',
        });
      });

      act(() => {
        jest.advanceTimersByTime(200);
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 1, previousValue: 50, newValue: 100 },
          ],
          description: 'Change channel 1',
        });
      });

      // Should be 1 action with 2 deltas
      expect(result.current.undoStackLength).toBe(1);

      let undoneAction: ReturnType<typeof result.current.undo>;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction!.channelDeltas).toHaveLength(2);
    });
  });

  describe('max stack size', () => {
    it('should enforce max stack size', () => {
      const { result } = renderHook(() => useUndoStack({ maxStackSize: 3, coalesceWindowMs: 0 }));

      // Push 5 actions
      for (let i = 0; i < 5; i++) {
        act(() => {
          jest.advanceTimersByTime(100);
          result.current.pushAction({
            type: 'CHANNEL_CHANGE',
            channelDeltas: [
              { fixtureId: 'fixture-1', channelIndex: i, previousValue: 0, newValue: i * 10 },
            ],
            description: `Change ${i}`,
          });
        });
      }

      // Should only have 3 actions
      expect(result.current.undoStackLength).toBe(3);

      // The oldest actions should have been removed
      let undoneAction: ReturnType<typeof result.current.undo>;
      act(() => {
        undoneAction = result.current.undo();
      });
      expect(undoneAction!.channelDeltas![0].channelIndex).toBe(4);

      act(() => {
        undoneAction = result.current.undo();
      });
      expect(undoneAction!.channelDeltas![0].channelIndex).toBe(3);

      act(() => {
        undoneAction = result.current.undo();
      });
      expect(undoneAction!.channelDeltas![0].channelIndex).toBe(2);

      // No more to undo
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear both undo and redo stacks', () => {
      const { result } = renderHook(() => useUndoStack());

      act(() => {
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 200 },
          ],
          description: 'Change',
        });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoStackLength).toBe(0);
      expect(result.current.redoStackLength).toBe(0);
    });
  });

  describe('multiple undo/redo cycles', () => {
    it('should handle multiple undo/redo cycles correctly', () => {
      const { result } = renderHook(() => useUndoStack({ coalesceWindowMs: 0 }));

      // Push 3 actions
      for (let i = 1; i <= 3; i++) {
        act(() => {
          jest.advanceTimersByTime(100);
          result.current.pushAction({
            type: 'CHANNEL_CHANGE',
            channelDeltas: [
              { fixtureId: 'fixture-1', channelIndex: 0, previousValue: (i - 1) * 100, newValue: i * 100 },
            ],
            description: `Change ${i}`,
          });
        });
      }

      expect(result.current.undoStackLength).toBe(3);

      // Undo twice
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.undoStackLength).toBe(1);
      expect(result.current.redoStackLength).toBe(2);

      // Redo once
      act(() => {
        result.current.redo();
      });

      expect(result.current.undoStackLength).toBe(2);
      expect(result.current.redoStackLength).toBe(1);

      // Push new action - should clear redo
      act(() => {
        jest.advanceTimersByTime(100);
        result.current.pushAction({
          type: 'CHANNEL_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 200, newValue: 250 },
          ],
          description: 'New change',
        });
      });

      expect(result.current.undoStackLength).toBe(3);
      expect(result.current.redoStackLength).toBe(0);
    });
  });

  describe('active deltas', () => {
    it('should handle active toggle deltas', () => {
      const { result } = renderHook(() => useUndoStack());

      act(() => {
        result.current.pushAction({
          type: 'ACTIVE_TOGGLE',
          activeDeltas: [{ fixtureId: 'fixture-1', channelIndex: 0, wasActive: true }],
          description: 'Deactivate channel',
        });
      });

      expect(result.current.undoStackLength).toBe(1);

      let undoneAction: ReturnType<typeof result.current.undo>;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction!.activeDeltas).toHaveLength(1);
      expect(undoneAction!.activeDeltas![0].wasActive).toBe(true);
    });
  });

  describe('batch changes', () => {
    it('should handle batch changes with multiple deltas', () => {
      const { result } = renderHook(() => useUndoStack());

      act(() => {
        result.current.pushAction({
          type: 'BATCH_CHANGE',
          channelDeltas: [
            { fixtureId: 'fixture-1', channelIndex: 0, previousValue: 100, newValue: 200 },
            { fixtureId: 'fixture-1', channelIndex: 1, previousValue: 50, newValue: 100 },
            { fixtureId: 'fixture-2', channelIndex: 0, previousValue: 0, newValue: 255 },
          ],
          description: 'Batch update',
        });
      });

      expect(result.current.undoStackLength).toBe(1);

      let undoneAction: ReturnType<typeof result.current.undo>;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction!.channelDeltas).toHaveLength(3);
    });
  });
});
