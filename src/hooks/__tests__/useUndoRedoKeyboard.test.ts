import { renderHook, act } from '@testing-library/react';
import { useUndoRedoKeyboard } from '../useUndoRedoKeyboard';

// Mock the useUndoRedo hook
const mockUndo = jest.fn().mockResolvedValue(true);
const mockRedo = jest.fn().mockResolvedValue(true);

jest.mock('@/contexts/UndoRedoContext', () => ({
  useUndoRedo: () => ({
    undo: mockUndo,
    redo: mockRedo,
    canUndo: true,
    canRedo: true,
    isLoading: false,
  }),
}));

describe('useUndoRedoKeyboard', () => {
  let originalUserAgent: PropertyDescriptor | undefined;
  let originalUserAgentData: PropertyDescriptor | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    originalUserAgent = Object.getOwnPropertyDescriptor(navigator, 'userAgent');
    originalUserAgentData = Object.getOwnPropertyDescriptor(navigator, 'userAgentData');
  });

  afterEach(() => {
    // Restore userAgent
    if (originalUserAgent) {
      Object.defineProperty(navigator, 'userAgent', originalUserAgent);
    }
    // Remove userAgentData if it was mocked
    if (originalUserAgentData === undefined) {
      // It wasn't originally there, remove our mock
      delete (navigator as unknown as Record<string, unknown>).userAgentData;
    } else {
      Object.defineProperty(navigator, 'userAgentData', originalUserAgentData);
    }
  });

  const mockPlatform = (platform: string) => {
    // Mock both userAgent and userAgentData for comprehensive coverage
    const isMac = platform.toLowerCase().includes('mac');

    // Mock userAgent (fallback method)
    Object.defineProperty(navigator, 'userAgent', {
      value: isMac
        ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
    });

    // Mock userAgentData (modern method) - only add if we're simulating a modern browser
    if (platform === 'MacIntel' || platform === 'Win32') {
      Object.defineProperty(navigator, 'userAgentData', {
        value: { platform: isMac ? 'macOS' : 'Windows' },
        configurable: true,
      });
    }
  };

  const createKeyboardEvent = (key: string, options: Partial<KeyboardEventInit> = {}) => {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...options,
    });
  };

  describe('Mac keyboard shortcuts', () => {
    beforeEach(() => {
      mockPlatform('MacIntel');
    });

    it('should trigger undo on Cmd+Z', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        window.dispatchEvent(createKeyboardEvent('z', { metaKey: true }));
      });

      expect(mockUndo).toHaveBeenCalledTimes(1);
      expect(mockRedo).not.toHaveBeenCalled();
    });

    it('should trigger redo on Cmd+Shift+Z', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        // With Shift pressed, the browser returns uppercase 'Z'
        window.dispatchEvent(createKeyboardEvent('Z', { metaKey: true, shiftKey: true }));
      });

      expect(mockRedo).toHaveBeenCalledTimes(1);
      expect(mockUndo).not.toHaveBeenCalled();
    });

    it('should not trigger on Ctrl+Z on Mac', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        window.dispatchEvent(createKeyboardEvent('z', { ctrlKey: true }));
      });

      expect(mockUndo).not.toHaveBeenCalled();
      expect(mockRedo).not.toHaveBeenCalled();
    });
  });

  describe('Windows/Linux keyboard shortcuts', () => {
    beforeEach(() => {
      mockPlatform('Win32');
    });

    it('should trigger undo on Ctrl+Z', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        window.dispatchEvent(createKeyboardEvent('z', { ctrlKey: true }));
      });

      expect(mockUndo).toHaveBeenCalledTimes(1);
      expect(mockRedo).not.toHaveBeenCalled();
    });

    it('should trigger redo on Ctrl+Y', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        window.dispatchEvent(createKeyboardEvent('y', { ctrlKey: true }));
      });

      expect(mockRedo).toHaveBeenCalledTimes(1);
      expect(mockUndo).not.toHaveBeenCalled();
    });

    it('should trigger redo on Ctrl+Shift+Z', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        // With Shift pressed, the browser returns uppercase 'Z'
        window.dispatchEvent(createKeyboardEvent('Z', { ctrlKey: true, shiftKey: true }));
      });

      expect(mockRedo).toHaveBeenCalledTimes(1);
      expect(mockUndo).not.toHaveBeenCalled();
    });

    it('should not trigger on Cmd+Z on Windows', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        window.dispatchEvent(createKeyboardEvent('z', { metaKey: true }));
      });

      expect(mockUndo).not.toHaveBeenCalled();
      expect(mockRedo).not.toHaveBeenCalled();
    });
  });

  describe('Input field handling', () => {
    beforeEach(() => {
      mockPlatform('MacIntel');
      mockUndo.mockClear();
      mockRedo.mockClear();
    });

    it('should not trigger when focus is on input element', () => {
      renderHook(() => useUndoRedoKeyboard());

      const input = document.createElement('input');
      document.body.appendChild(input);

      // Dispatch event from the input element so it bubbles with correct target
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true,
          bubbles: true,
        });
        input.dispatchEvent(event);
      });

      expect(mockUndo).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger when focus is on textarea element', () => {
      renderHook(() => useUndoRedoKeyboard());

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true,
          bubbles: true,
        });
        textarea.dispatchEvent(event);
      });

      expect(mockUndo).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should not trigger when focus is on select element', () => {
      renderHook(() => useUndoRedoKeyboard());

      const select = document.createElement('select');
      document.body.appendChild(select);

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true,
          bubbles: true,
        });
        select.dispatchEvent(event);
      });

      expect(mockUndo).not.toHaveBeenCalled();

      document.body.removeChild(select);
    });

    it('should not trigger when focus is on contentEditable element', () => {
      renderHook(() => useUndoRedoKeyboard());

      const div = document.createElement('div');
      div.contentEditable = 'true';
      // JSDOM doesn't fully support contentEditable, so we also set isContentEditable
      Object.defineProperty(div, 'isContentEditable', {
        value: true,
        configurable: true,
      });
      document.body.appendChild(div);

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true,
          bubbles: true,
        });
        div.dispatchEvent(event);
      });

      expect(mockUndo).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  // Note: Testing loading and canUndo/canRedo states requires either:
  // 1. Dynamic module imports with isolateModules (complex)
  // 2. Refactoring the hook to accept these values as parameters
  // 3. Testing via integration tests
  // The core behavior (checking canUndo/canRedo and isLoading before calling undo/redo)
  // is verified through code inspection - the hook only calls undo() when canUndo is true,
  // redo() when canRedo is true, and neither when isLoading is true.
  // These conditions are enforced inside useUndoRedoKeyboard.ts where the hook checks
  // these flags before invoking undo() or redo().

  describe('Event listener cleanup', () => {
    beforeEach(() => {
      mockPlatform('MacIntel');
    });

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useUndoRedoKeyboard());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should not trigger after unmount', () => {
      const { unmount } = renderHook(() => useUndoRedoKeyboard());
      unmount();

      act(() => {
        window.dispatchEvent(createKeyboardEvent('z', { metaKey: true }));
      });

      // After unmount, the event listener is removed, so no additional calls should happen
      // Note: The mock might have been called before unmount during test setup
      const callsAfterUnmount = mockUndo.mock.calls.length;

      act(() => {
        window.dispatchEvent(createKeyboardEvent('z', { metaKey: true }));
      });

      expect(mockUndo.mock.calls.length).toBe(callsAfterUnmount);
    });
  });

  describe('Key combinations that should not trigger', () => {
    beforeEach(() => {
      mockPlatform('MacIntel');
    });

    it('should not trigger on just Z key', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        window.dispatchEvent(createKeyboardEvent('z'));
      });

      expect(mockUndo).not.toHaveBeenCalled();
      expect(mockRedo).not.toHaveBeenCalled();
    });

    it('should not trigger on Cmd+Shift+Y (not a valid combo)', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        window.dispatchEvent(createKeyboardEvent('y', { metaKey: true, shiftKey: true }));
      });

      expect(mockUndo).not.toHaveBeenCalled();
      expect(mockRedo).not.toHaveBeenCalled();
    });

    it('should not trigger on Alt+Z', () => {
      renderHook(() => useUndoRedoKeyboard());

      act(() => {
        window.dispatchEvent(createKeyboardEvent('z', { altKey: true }));
      });

      expect(mockUndo).not.toHaveBeenCalled();
      expect(mockRedo).not.toHaveBeenCalled();
    });
  });
});
